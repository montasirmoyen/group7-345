import Link from "next/link";
import {
    ArrowRight,
    Briefcase,
    Clock3,
    FileStack,
    KanbanSquare,
    ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { KanbanDemo } from "@/components/ui/kanban";

export function Dashboard() {
    return (
        <section className="relative isolate overflow-hidden">
            <div className="mx-auto w-full ">
                <KanbanDemo /> 
            </div>
        </section>
    );
}
