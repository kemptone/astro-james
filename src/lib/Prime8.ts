type Attr = {
  [k: string]: string | null
}

export class Prime8 extends HTMLElement {
  private updateReloadQueued = false
  private updateClientQueued = false

  static get observedAttributes() {
    return [""]
  }

  // eslint-disable-next-line no-unused-vars
  onClientChange?(dataset: DOMStringMap): void
  // eslint-disable-next-line no-unused-vars
  onReload?(attrs: Attr): void

  private setPathWithParams(
    paramObj: Record<string, string>,
    fragmentPath: string,
  ): string {
    const params = new URLSearchParams()
    Object.entries(paramObj).forEach(([key, value]) => {
      if (value && value?.toString) {
        params.set(key, value.toString())
      }
    })
    return `${fragmentPath}?${params.toString()}`
  }

  queueClientUpdate() {
    if (this.updateClientQueued) return
    this.updateClientQueued = true
    queueMicrotask(async () => {
      this.updateClientQueued = false
      this.onClientChange?.(this.dataset)
    })
  }

  queueReloadUpdate() {
    if (this.updateReloadQueued) return
    this.updateReloadQueued = true
    queueMicrotask(async () => {
      this.updateReloadQueued = false
      // collect final state after all changes
      const attrs = Object.fromEntries(
        (this.constructor as typeof Prime8).observedAttributes
          .filter((a) => !a.startsWith("data-"))
          .map((a) => [a, this.getAttribute(a)]),
      )
      await this.reload(attrs as Record<string, string>)
      this.onReload?.(attrs)
    })
  }

  async attributeChangedCallback(
    name: string,
    oldVal: string | null,
    newVal: string | null,
  ) {
    if (oldVal === newVal || oldVal === null) return

    // ingore selected from reload
    // and handle it only with style
    if (name.startsWith("data-")) {
      return this.queueClientUpdate()
    }

    this.queueReloadUpdate()
  }

  // We can totally use POST for these requests, with Content-Type: "application-json"
  // This will make it easy to convert the body object into a regular JSON object
  // allowing us to pass large values to the fragments without limit of the url
  // The only downside would be cacheing is probably not possible
  // maybe this is even a feature, since, these components might get stale cached data
  // See documentation here: https://chatgpt.com/share/68a53625-70ac-8006-b567-b98423e2fb61
  async reload(
    formValues: Record<string, string>,
    method: "POST" | "GET" = "GET",
  ): Promise<void> {
    const { fragment_path } = this.dataset
    if (!fragment_path) return

    const headers = { "X-Fragment": "1" }
    let res: Response | undefined

    if (method === "GET") {
      res = await fetch(this.setPathWithParams(formValues, fragment_path), {
        headers,
      })
    } else {
      res = await fetch(fragment_path, {
        headers,
        body: JSON.stringify(formValues),
      })
    }

    const html = await res.text()

    // Parse safely, and, it puts the scripts and styles in the head, nice
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const new_component = doc.body.firstChild as Element

    if (!new_component) return

    // Replace all attributes with new component's attributes
    // Array.from(this.attributes).forEach(attr => this.removeAttribute(attr.name));
    Array.from(new_component.attributes).forEach((attr) =>
      this.setAttribute(attr.name, attr.value),
    )

    this.innerHTML = new_component.innerHTML
  }

  async loadInto(
    target: HTMLElement,
    fragmentPath: string,
    formValues: Record<string, string> = {},
    method: "POST" | "GET" = "GET",
  ): Promise<void> {
    const headers = { "X-Fragment": "1" }
    let res: Response | undefined

    if (method === "GET") {
      res = await fetch(this.setPathWithParams(formValues, fragmentPath), {
        headers,
      })
    } else {
      res = await fetch(fragmentPath, {
        headers,
        body: JSON.stringify(formValues),
      })
    }

    const html = await res.text()

    // Parse safely, and, it puts the scripts and styles in the head, nice
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const new_component = doc.body.firstChild as Element

    if (!new_component) return

    // Append the new component as a child to the target element
    target.appendChild(new_component)
  }
}
