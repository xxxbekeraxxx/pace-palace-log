import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Gauge, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Run {
  id: string;
  distance: number;
  duration: number;
  pace: number;
  run_type: string;
  notes: string | null;
  date: string;
}

interface RunsListProps {
  userId?: string;
}

const runTypeLabels: Record<string, string> = {
  easy: "Легкая",
  tempo: "Темповая",
  interval: "Интервальная",
  long: "Длительная",
  recovery: "Восстановительная",
};

const runTypeColors: Record<string, string> = {
  easy: "bg-green-500/10 text-green-700 dark:text-green-400",
  tempo: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  interval: "bg-red-500/10 text-red-700 dark:text-red-400",
  long: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  recovery: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

const RunsList = ({ userId }: RunsListProps) => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchRuns = async () => {
      const { data, error } = await supabase
        .from("runs")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching runs:", error);
      } else {
        setRuns(data || []);
      }
      setIsLoading(false);
    };

    fetchRuns();
  }, [userId]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32 bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">
            Пока нет пробежек. Добавьте свою первую тренировку!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {runs.map((run) => (
        <Card key={run.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={runTypeColors[run.run_type] || runTypeColors.easy}>
                    {runTypeLabels[run.run_type] || run.run_type}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(run.date), "d MMM yyyy", { locale: ru })}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Дистанция</p>
                      <p className="text-lg font-bold">{run.distance.toFixed(1)} км</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Время</p>
                      <p className="text-lg font-bold">{formatDuration(run.duration)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Темп</p>
                      <p className="text-lg font-bold">{run.pace.toFixed(1)} мин/км</p>
                    </div>
                  </div>
                </div>

                {run.notes && (
                  <p className="text-sm text-muted-foreground italic">{run.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RunsList;
