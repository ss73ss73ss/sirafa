import { Badge } from "@/components/ui/badge";

interface UnreadBadgeProps {
  count: number;
}

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (!count || count <= 0) return null;
  
  return (
    <Badge 
      variant="destructive" 
      className="mr-auto ml-2 px-2 py-0 text-xs h-5 min-w-[20px] flex items-center justify-center"
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}