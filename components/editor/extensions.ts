import StarterKit from "@tiptap/starter-kit";
import { isSafeRichTextLink } from "@/lib/utils/richText";

export const richTextExtensions = (readonly = false) => [
  StarterKit.configure({
    link: {
      openOnClick: readonly,
      defaultProtocol: "https",
      isAllowedUri: isSafeRichTextLink,
      HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
    },
  }),
];
