const blockedHosts = ["cdn.segment.com", "sessions.bugsnag.com"] as const

type BlockedHost = (typeof blockedHosts)[number]

declare global {
  interface Window {
    __ccgAnalyticsBlocker__?: boolean
  }
}

const matchesBlockedHost = (value: string | null | undefined): value is string => {
  if (!value) return false
  try {
    const url = new URL(value, window.location.origin)
    return blockedHosts.includes(url.hostname as BlockedHost)
  } catch {
    return blockedHosts.some((host) => value.includes(host))
  }
}

const neutralizeScript = (script: HTMLScriptElement): boolean => {
  if (!matchesBlockedHost(script.src) && !matchesBlockedHost(script.getAttribute("src"))) {
    return false
  }
  const original = script.getAttribute("src") ?? script.src
  if (original) {
    script.dataset.blockedSrc = original
  }
  script.removeAttribute("src")
  script.type = "text/plain"
  if (script.parentNode) {
    script.parentNode.removeChild(script)
  }
  return true
}

type AppendChild = typeof Node.prototype.appendChild
const guardAppendChild = (original: AppendChild): AppendChild => {
  return function appendChild<T extends Node>(this: Node, child: T): T {
    if (child instanceof HTMLScriptElement) {
      if (neutralizeScript(child)) {
        return child
      }
    }
    return original.call(this, child) as T
  }
}

type InsertBefore = typeof Node.prototype.insertBefore
const guardInsertBefore = (original: InsertBefore): InsertBefore => {
  return function insertBefore<T extends Node>(this: Node, child: T, ref: Node | null): T {
    if (child instanceof HTMLScriptElement) {
      if (neutralizeScript(child)) {
        return child
      }
    }
    return original.call(this, child, ref) as T
  }
}

const overrideSetAttribute = () => {
  const originalSetAttribute = HTMLScriptElement.prototype.setAttribute
  HTMLScriptElement.prototype.setAttribute = function setAttribute(name: string, value: string): void {
    if (name === "src" && matchesBlockedHost(value)) {
      neutralizeScript(this)
      return
    }
    originalSetAttribute.call(this, name, value)
  }
}

const overrideSrcDescriptor = () => {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src")
  if (!descriptor || descriptor.configurable === false || !descriptor.set || !descriptor.get) {
    return
  }
  Object.defineProperty(HTMLScriptElement.prototype, "src", {
    configurable: true,
    enumerable: descriptor.enumerable ?? false,
    get(this: HTMLScriptElement) {
      return descriptor.get!.call(this)
    },
    set(this: HTMLScriptElement, value: string) {
      if (matchesBlockedHost(value)) {
        neutralizeScript(this)
        return
      }
      descriptor.set!.call(this, value)
    },
  })
}

const observeMutations = () => {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLScriptElement) {
          neutralizeScript(node)
        } else if (node instanceof Element) {
          node.querySelectorAll("script").forEach((script) => {
            if (script instanceof HTMLScriptElement) {
              neutralizeScript(script)
            }
          })
        }
      }
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

export const setupAnalyticsBlock = (): void => {
  if (typeof window === "undefined") return
  if (window.__ccgAnalyticsBlocker__) return
  window.__ccgAnalyticsBlocker__ = true

  Node.prototype.appendChild = guardAppendChild(Node.prototype.appendChild)
  Node.prototype.insertBefore = guardInsertBefore(Node.prototype.insertBefore)
  overrideSetAttribute()
  overrideSrcDescriptor()
  observeMutations()

  document.querySelectorAll("script").forEach((script) => {
    if (script instanceof HTMLScriptElement) {
      neutralizeScript(script)
    }
  })
}

setupAnalyticsBlock()
