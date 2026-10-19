import { fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { SafeMarkdown, SafeMarkdownEditor } from "./safe-markdown";

const hostile = `
# Requirements

<script>alert('script')</script>
<iframe src="https://evil.example"></iframe>
<object data="https://evil.example"></object>
<embed src="https://evil.example">
<svg onload="alert('svg')"><a xlink:href="javascript:alert(1)">svg link</a></svg>
<math><mtext><img src="x" onerror="alert('math')"></mtext></math>
<form id="location"><input name="cookie"></form>
<div style="background:url(javascript:alert(1))" onclick="alert(1)">styled text</div>
<img src="https://example.com/logo.png" onerror="alert('img')">
<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">
<a href="javascript:alert(1)">raw javascript</a>
<a href="jav&#x61;script:alert(1)">encoded javascript</a>
<a href="vbscript:msgbox(1)">vbscript</a>
<a href="data:text/html;base64,PHNjcmlwdD4=">data link</a>

[markdown javascript](javascript:alert%281%29)

![bad image](javascript:alert%281%29)

[good link](https://example.com/jobs)

**Required:** React and SQL.

- Communication
- Testing

| Skill | Level |
| --- | --- |
| React | Strong |

\`inline code\`

\`\`\`js
const message = "<script>stay text</script>";
\`\`\`
`;

function assertSafe(preview) {
  expect(preview).toBeTruthy();
  expect(preview.querySelector("script, iframe, object, embed, svg, math, form")).toBeNull();
  for (const element of preview.querySelectorAll("*")) {
    for (const attribute of element.attributes) {
      expect(attribute.name).not.toMatch(/^on|^style$/i);
      if (["href", "src", "xlink:href"].includes(attribute.name)) {
        // Strip URL whitespace before checking the scheme.
        expect(attribute.value.replace(/\s/g, "")).not.toMatch(/^(javascript|vbscript|data):/i);
      }
    }
  }
  expect(preview.querySelector('a[href="https://example.com/jobs"]')).toBeTruthy();
  expect(preview.querySelector('img[src="https://example.com/logo.png"]')).toBeTruthy();
  expect(preview.querySelector("strong").textContent).toBe("Required:");
  expect(preview.querySelectorAll("li")).toHaveLength(2);
  expect(preview.querySelector("table")).toBeTruthy();
  expect(preview.querySelector("pre code").textContent).toContain("<script>stay text</script>");
  expect(preview.querySelector('[id="location"]')).toBeNull();
}

describe("untrusted listing Markdown", () => {
  it("sanitizes persisted requirements without losing ordinary Markdown", () => {
    const { container } = render(<SafeMarkdown source={hostile} />);
    assertSafe(container.querySelector(".wmde-markdown"));
  });

  it("sanitizes the actual editor preview and subsequent edits", () => {
    function Editor() {
      const [value, setValue] = useState("Initial text");
      return <SafeMarkdownEditor value={value} onChange={setValue} />;
    }
    const { container } = render(<Editor />);
    fireEvent.change(container.querySelector("textarea"), { target: { value: hostile } });
    assertSafe(container.querySelector(".wmde-markdown"));
  });

  it("sanitizes after caller-supplied rewrites, including HTML parsed by skipHtml=false", () => {
    const { container } = render(<SafeMarkdown
      source={'<b onclick="alert(1)">safe text</b>'}
      skipHtml={false}
      rehypeRewrite={(node) => {
        if (node.type === "element" && node.tagName === "b") node.properties.onClick = "alert(2)";
      }}
    />);
    expect(container.textContent).toContain("safe text");
    expect(container.querySelector("[onclick]")).toBeNull();
  });
});
