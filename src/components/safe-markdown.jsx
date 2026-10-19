import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";

// Run the default allowlist after ALL HTML parsing/rewriting/highlighting plugins.
// Keep this policy shared by the live editor preview and persisted listings.
const sanitizeLast = (type, plugins) =>
  type === "rehype" ? [...plugins, rehypeSanitize] : plugins;

export function SafeMarkdown(props) {
  return <MDEditor.Markdown {...props} pluginsFilter={sanitizeLast} />;
}

export function SafeMarkdownEditor({ previewOptions, ...props }) {
  return (
    <MDEditor
      {...props}
      previewOptions={{ ...previewOptions, pluginsFilter: sanitizeLast }}
    />
  );
}
