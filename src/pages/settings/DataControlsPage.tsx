/** @doc Data controls — hub listing the user's stored content (images, videos, files, sites, shared chats). */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image, Video, FileText, Globe, Share2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserLang } from "@/hooks/useUserLang";
import { SubShell, SubSection, SubRowList, SubRow } from "@/components/settings/SubShell";

type Counts = { images: number; videos: number; files: number; sites: number; shared: number };

export default function DataControlsPage() {
  const navigate = useNavigate();
  const lang = useUserLang();
  const isAr = lang === "ar" || lang === "ar-eg" || lang === "he" || lang === "fa";
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const q = async (
        table: string,
        build: (b: any) => any,
      ): Promise<number> => {
        try {
          const { count } = await build(
            supabase.from(table as any).select("id", { count: "exact", head: true }).eq("user_id", uid),
          );
          return count ?? 0;
        } catch {
          return 0;
        }
      };
      const [images, videos, files, sites, shared] = await Promise.all([
        q("media_assets", (b) => b.eq("kind", "image")),
        q("media_assets", (b) => b.eq("kind", "video")),
        q("user_assets", (b) => b),
        q("generated_sites", (b) => b),
        q("conversations", (b) => b.eq("is_shared", true)),
      ]);
      if (alive) setCounts({ images, videos, files, sites, shared });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const n = (v?: number) => (counts ? String(v ?? 0) : "…");

  return (
    <SubShell
      title={isAr ? "ضوابط البيانات" : "Data controls"}
      subtitle={
        isAr
          ? "كل ما أنشأته أو رفعته داخل Megsy، في مكان واحد."
          : "Everything you created or uploaded in Megsy, in one place."
      }
    >
      <SubSection title={isAr ? "محتواك" : "Your content"}>
        <SubRowList>
          <SubRow
            icon={Image}
            label={isAr ? "الصور" : "Images"}
            hint={isAr ? "الصور التي أنشأتها بالذكاء الاصطناعي" : "AI-generated images"}
            trailing={<span className="text-[12px] tabular-nums">{n(counts?.images)}</span>}
            onClick={() => navigate("/settings/data/images")}
          />
          <SubRow
            icon={Video}
            label={isAr ? "الفيديوهات" : "Videos"}
            hint={isAr ? "مقاطع الفيديو المولدة" : "Generated videos"}
            trailing={<span className="text-[12px] tabular-nums">{n(counts?.videos)}</span>}
            onClick={() => navigate("/settings/data/videos")}
          />
          <SubRow
            icon={FileText}
            label={isAr ? "الملفات" : "Files"}
            hint={isAr ? "الملفات المرفوعة والمرفقات" : "Uploads and attachments"}
            trailing={<span className="text-[12px] tabular-nums">{n(counts?.files)}</span>}
            onClick={() => navigate("/settings/data/files")}
          />
          <SubRow
            icon={Globe}
            label={isAr ? "المواقع المنشورة" : "Published sites"}
            hint={isAr ? "المواقع التي بناها Megsy لك" : "Sites Megsy built for you"}
            trailing={<span className="text-[12px] tabular-nums">{n(counts?.sites)}</span>}
            onClick={() => navigate("/settings/data/sites")}
          />
          <SubRow
            icon={Share2}
            label={isAr ? "المحادثات المشتركة" : "Shared chats"}
            hint={isAr ? "المحادثات التي شاركتها برابط" : "Conversations shared via link"}
            trailing={<span className="text-[12px] tabular-nums">{n(counts?.shared)}</span>}
            onClick={() => navigate("/settings/data/shared")}
          />
        </SubRowList>
      </SubSection>

      <SubSection title={isAr ? "الخصوصية" : "Privacy"}>
        <SubRowList>
          <SubRow
            icon={Download}
            label={isAr ? "تنزيل بياناتي والخصوصية" : "Download my data & privacy"}
            onClick={() => navigate("/settings/privacy")}
          />
        </SubRowList>
      </SubSection>
    </SubShell>
  );
}
