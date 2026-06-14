import Link from "next/link";
import type { ReactNode } from "react";
import type { RichText } from "@/schemas/cms.schema";

type Node = RichText["content"][number] | {
  type: "text";
  text: string;
  marks?: Array<{ type: "bold" | "italic" | "link"; attrs?: { href: string } }>;
};

function TextNode({ node }: { node: Extract<Node, { type: "text" }> }) {
  let content: ReactNode = node.text;
  for (const mark of node.marks || []) {
    if (mark.type === "bold") content = <strong>{content}</strong>;
    if (mark.type === "italic") content = <em>{content}</em>;
    if (mark.type === "link" && mark.attrs?.href) {
      content = <Link href={mark.attrs.href} className="underline underline-offset-2">{content}</Link>;
    }
  }
  return content;
}

function RenderNode({ node }: { node: Node }) {
  if (node.type === "text") return <TextNode node={node} />;
  const children = (node.content || []).map((child, index) => <RenderNode key={index} node={child as Node} />);
  if (node.type === "bulletList") return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
  if (node.type === "orderedList") return <ol className="list-decimal space-y-1 pl-5">{children}</ol>;
  if (node.type === "listItem") return <li>{children}</li>;
  return <p>{children}</p>;
}

export function RichTextRenderer({
  value,
  className = "",
}: {
  value: RichText;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {value.content.map((node, index) => <RenderNode key={index} node={node} />)}
    </div>
  );
}
