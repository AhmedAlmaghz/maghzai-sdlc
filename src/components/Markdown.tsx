"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="mb-2 mt-6 text-2xl font-extrabold text-white first:mt-0" {...props} />,
          h2: (props) => <h2 className="mb-2 mt-6 text-xl font-bold text-white first:mt-0" {...props} />,
          h3: (props) => <h3 className="mb-1.5 mt-4 text-base font-bold text-indigo-200" {...props} />,
          p: (props) => <p className="text-slate-300" {...props} />,
          ul: (props) => <ul className="list-disc space-y-1 pr-5 text-slate-300" {...props} />,
          ol: (props) => <ol className="list-decimal space-y-1 pr-5 text-slate-300" {...props} />,
          li: (props) => <li className="marker:text-indigo-400" {...props} />,
          strong: (props) => <strong className="font-bold text-white" {...props} />,
          blockquote: (props) => (
            <blockquote
              className="rounded-lg border-r-2 border-indigo-400/60 bg-indigo-400/5 px-4 py-2 text-slate-400"
              {...props}
            />
          ),
          code: (props) => (
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-fuchsia-200" {...props} />
          ),
          pre: (props) => (
            <pre
              className="overflow-x-auto rounded-xl border border-white/10 bg-[#05050a] p-4 font-mono text-xs leading-relaxed text-slate-300"
              {...props}
            />
          ),
          table: (props) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs" {...props} />
            </div>
          ),
          th: (props) => (
            <th className="border border-white/10 bg-white/5 px-3 py-2 text-right font-bold text-slate-200" {...props} />
          ),
          td: (props) => <td className="border border-white/10 px-3 py-2 text-slate-400" {...props} />,
          hr: () => <hr className="my-4 border-white/10" />,
          a: (props) => <a className="text-indigo-300 underline" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
