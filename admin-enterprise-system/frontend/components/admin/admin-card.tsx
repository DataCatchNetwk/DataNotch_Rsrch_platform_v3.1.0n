
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export function AdminCard({title,description,children}:{title:string;description?:string;children:React.ReactNode}) {
  return <Card className="rounded-2xl border-0 shadow-sm"><CardHeader><CardTitle>{title}</CardTitle>{description?<CardDescription>{description}</CardDescription>:null}</CardHeader><CardContent>{children}</CardContent></Card>;
}
