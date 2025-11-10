import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Activity, LogOut, Plus, TrendingUp, Clock, Award } from "lucide-react";
import AddRunDialog from "@/components/AddRunDialog";
import RunsList from "@/components/RunsList";
import StatsCard from "@/components/StatsCard";

interface RunStats {
  totalRuns: number;
  totalDistance: number;
  totalDuration: number;
  avgPace: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<RunStats>({
    totalRuns: 0,
    totalDistance: 0,
    totalDuration: 0,
    avgPace: 0,
  });
  const [isAddRunOpen, setIsAddRunOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        fetchStats(user.id);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchStats(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, refreshKey]);

  const fetchStats = async (userId: string) => {
    const { data, error } = await supabase
      .from("runs")
      .select("distance, duration, pace")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching stats:", error);
      return;
    }

    if (data) {
      const totalRuns = data.length;
      const totalDistance = data.reduce((sum, run) => sum + run.distance, 0);
      const totalDuration = data.reduce((sum, run) => sum + run.duration, 0);
      const avgPace = data.length > 0
        ? data.reduce((sum, run) => sum + (run.pace || 0), 0) / data.length
        : 0;

      setStats({
        totalRuns,
        totalDistance,
        totalDuration,
        avgPace,
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Ошибка выхода",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Выход выполнен",
        description: "До скорой встречи!",
      });
      navigate("/auth");
    }
  };

  const handleRunAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Run Tracker</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Выход
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Привет, {user?.email?.split("@")[0]}!
          </h2>
          <p className="text-muted-foreground">Вот ваша статистика пробежек</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Всего пробежек"
            value={stats.totalRuns.toString()}
            icon={Activity}
            gradient="bg-gradient-primary"
          />
          <StatsCard
            title="Общая дистанция"
            value={`${stats.totalDistance.toFixed(1)} км`}
            icon={TrendingUp}
            gradient="bg-gradient-accent"
          />
          <StatsCard
            title="Общее время"
            value={formatDuration(stats.totalDuration)}
            icon={Clock}
            gradient="bg-gradient-primary"
          />
          <StatsCard
            title="Средний темп"
            value={stats.avgPace > 0 ? `${stats.avgPace.toFixed(1)} мин/км` : "—"}
            icon={Award}
            gradient="bg-gradient-accent"
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">История пробежек</h3>
          <Button onClick={() => setIsAddRunOpen(true)} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Добавить пробежку
          </Button>
        </div>

        <RunsList key={refreshKey} userId={user?.id} />
      </main>

      <AddRunDialog
        open={isAddRunOpen}
        onOpenChange={setIsAddRunOpen}
        userId={user?.id}
        onRunAdded={handleRunAdded}
      />
    </div>
  );
};

export default Dashboard;
