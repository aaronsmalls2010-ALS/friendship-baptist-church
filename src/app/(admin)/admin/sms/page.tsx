"use client";

import { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";

interface SmsLogEntry {
  id: string;
  recipient_group: string;
  message: string;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

const GROUP_LABELS: Record<string, string> = {
  all: "All Members",
  deacons: "Deacons",
  leaders: "Ministry Leaders",
  custom: "Custom",
};

export default function SmsCenterPage() {
  const [recipientGroup, setRecipientGroup] = useState("");
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // SMS history from API
  const [history, setHistory] = useState<SmsLogEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch SMS history on mount
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/admin/sms");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.messages || []);
        }
      } catch (error) {
        console.error("Failed to fetch SMS history:", error);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, []);

  const handleSend = async () => {
    if (!recipientGroup || !message) return;

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/admin/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientGroup,
          message,
          schedule,
          scheduleDate,
          scheduleTime,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSendResult({
          type: "success",
          message: `Message sent to ${data.sent} of ${data.total} recipients.${data.failed > 0 ? ` ${data.failed} failed.` : ""}`,
        });
        setMessage("");
        setRecipientGroup("");
        setSchedule("now");
        setScheduleDate("");
        setScheduleTime("");

        // Refresh history
        const histRes = await fetch("/api/admin/sms");
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(histData.messages || []);
        }
      } else {
        setSendResult({
          type: "error",
          message: data.error || "Failed to send messages",
        });
      }
    } catch (error) {
      console.error("SMS send error:", error);
      setSendResult({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setSending(false);
      setTimeout(() => setSendResult(null), 5000);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="SMS Center"
        description="Send text messages to church members via Twilio"
      />

      {/* Compose Message */}
      <div className="space-y-6">
        <h2 className="font-heading text-xl font-semibold text-warm-900 dark:text-warm-50">
          Compose Message
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            {sendResult && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  sendResult.type === "success"
                    ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                }`}
              >
                {sendResult.type === "success" ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {sendResult.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sms-recipient">Recipient Group</Label>
              <Select value={recipientGroup} onValueChange={setRecipientGroup}>
                <SelectTrigger id="sms-recipient">
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="deacons">Deacons</SelectItem>
                  <SelectItem value="leaders">Ministry Leaders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 160))}
                maxLength={160}
                rows={3}
              />
              <p className="text-xs text-warm-400 text-right">
                {message.length}/160 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sms-schedule">Schedule</Label>
              <Select value={schedule} onValueChange={setSchedule}>
                <SelectTrigger id="sms-schedule">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Send Now</SelectItem>
                  <SelectItem value="later">Schedule for Later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {schedule === "later" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-date">Date</Label>
                  <Input
                    id="sms-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms-time">Time</Label>
                  <Input
                    id="sms-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button
              className="bg-purple-700 hover:bg-purple-600 text-white"
              onClick={handleSend}
              disabled={!recipientGroup || !message || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Recent Messages */}
      <div className="space-y-6">
        <h2 className="font-heading text-xl font-semibold text-warm-900 dark:text-warm-50">
          Recent Messages
        </h2>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((msg) => (
              <Card key={msg.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        >
                          {GROUP_LABELS[msg.recipient_group] ||
                            msg.recipient_group}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            msg.failed_count === 0
                              ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                              : "border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400"
                          }
                        >
                          {msg.sent_count}/{msg.recipients_count} Delivered
                        </Badge>
                      </div>
                      <p className="text-sm text-warm-700 dark:text-warm-300">
                        {msg.message}
                      </p>
                      <p className="text-xs text-warm-400">
                        Sent{" "}
                        {new Date(msg.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800">
            <MessageSquare className="h-12 w-12 text-warm-300 mx-auto mb-3" />
            <p className="text-warm-500">
              No messages sent yet. Compose your first message above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
