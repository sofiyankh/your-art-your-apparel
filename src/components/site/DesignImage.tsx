import { useQuery } from "@tanstack/react-query";
import { signedDesignUrl } from "@/lib/queries";

/** Artwork lives in a private bucket, so it is always fetched via a signed URL. */
export function useSignedDesignUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-design", path],
    enabled: !!path,
    staleTime: 30 * 60 * 1000,
    queryFn: () => signedDesignUrl(path!),
  });
}

export function DesignImage({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const { data } = useSignedDesignUrl(path);
  if (!data) return <div className={`bg-accent ${className ?? ""}`} aria-hidden />;
  return <img src={data} alt={alt} className={className} loading="lazy" />;
}
