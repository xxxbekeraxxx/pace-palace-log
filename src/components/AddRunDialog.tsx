import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onRunAdded: () => void;
}

const AddRunDialog = ({ open, onOpenChange, userId, onRunAdded }: AddRunDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [distance, setDistance] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [runType, setRunType] = useState<string>("easy");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);

    try {
      const totalSeconds =
        (parseInt(hours) || 0) * 3600 +
        (parseInt(minutes) || 0) * 60 +
        (parseInt(seconds) || 0);

      if (totalSeconds === 0) {
        toast({
          title: "Ошибка",
          description: "Укажите продолжительность пробежки",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("runs").insert({
        user_id: userId,
        distance: parseFloat(distance),
        duration: totalSeconds,
        run_type: runType as any,
        notes: notes || null,
        date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Пробежка добавлена!",
        description: "Отличная работа! Продолжай в том же духе.",
      });

      // Reset form
      setDistance("");
      setHours("");
      setMinutes("");
      setSeconds("");
      setRunType("easy");
      setNotes("");
      onOpenChange(false);
      onRunAdded();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить пробежку</DialogTitle>
          <DialogDescription>
            Заполните данные о вашей тренировке
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Дистанция (км)</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                placeholder="5.0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Продолжительность</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Часы"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Минуты"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    min="0"
                    max="59"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Секунды"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    min="0"
                    max="59"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="run-type">Тип пробежки</Label>
              <Select value={runType} onValueChange={setRunType}>
                <SelectTrigger id="run-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Легкая</SelectItem>
                  <SelectItem value="tempo">Темповая</SelectItem>
                  <SelectItem value="interval">Интервальная</SelectItem>
                  <SelectItem value="long">Длительная</SelectItem>
                  <SelectItem value="recovery">Восстановительная</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Заметки (опционально)</Label>
              <Textarea
                id="notes"
                placeholder="Как прошла тренировка?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRunDialog;
