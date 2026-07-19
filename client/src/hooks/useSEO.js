import { useEffect } from "react";

export default function useSEO(title, description) {
  useEffect(() => {
    if (title) {
      document.title = `${title} - HảiSản.vn`;
    }
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }
  }, [title, description]);
}
