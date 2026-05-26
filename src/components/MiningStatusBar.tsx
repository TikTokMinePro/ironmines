import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CircleDot, Sparkles, Pickaxe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface MiningStatusBarProps {
  countLabel: string;
  extraStat?: string;
}

export function MiningStatusBar({ countLabel, extraStat }: MiningStatusBarProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Check if any mining job is currently running
  const { data: isRunning } = useQuery({
    queryKey: ["mining-running"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mining_jobs")
        .select("id")
        .eq("status", "running")
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    refetchInterval: 15_000,
  });

  const { cycleProgress, timeRemaining } = useMemo(() => {
    const current = new Date(now);
    const MINING_HOUR_UTC = 2;
    const todayRun = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), MINING_HOUR_UTC, 0, 0));
    const prevRun = todayRun.getTime() <= now ? todayRun : new Date(todayRun.getTime() - 24 * 60 * 60 * 1000);
    const nextRun = new Date(prevRun.getTime() + 24 * 60 * 60 * 1000);

    const cycleMs = 24 * 60 * 60 * 1000;
    const elapsedMs = now - prevRun.getTime();
    const progress = Math.min((elapsedMs / cycleMs) * 100, 100);
    const remainingMs = nextRun.getTime() - now;
    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);

    return {
      cycleProgress: progress,
      timeRemaining: remainingMs <= 60000 ? "Minerando..." : `${h}h ${m.toString().padStart(2, "0")}min`,
    };
  }, [now]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            {isRunning ? (
              <>
                <Pickaxe className="w-3.5 h-3.5 text-warning animate-bounce shrink-0" />
                <Badge variant="outline" className="text-xs gap-1.5 py-0.5 px-2 border-warning/30 text-warning animate-pulse">
                  Minerando…
                </Badge>
              </>
            ) : (
              <>
                <CircleDot className="w-3.5 h-3.5 text-success animate-pulse shrink-0" />
                <Badge variant="outline" className="text-xs gap-1.5 py-0.5 px-2 border-success/30 text-success">
                  Sistema Online
                </Badge>
              </>
            )}
            <span className="text-muted-foreground text-xs">• {countLabel}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {isRunning ? "Em andamento…" : `Próxima: ${timeRemaining}`}
            </span>
            {extraStat && <span className="font-bold text-success text-sm">{extraStat}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isRunning ? "text-warning animate-spin" : "text-primary"}`} />
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
            {isRunning ? "Mineração ativa" : "Ciclo de mineração"}
          </span>
          <Progress value={isRunning ? undefined : cycleProgress} className={`flex-1 h-1.5 ${isRunning ? "animate-pulse" : ""}`} />
          {!isRunning && <span className="text-xs text-primary font-medium tabular-nums">{Math.round(cycleProgress)}%</span>}
        </div>
      </CardContent>
    </Card>
  );
}