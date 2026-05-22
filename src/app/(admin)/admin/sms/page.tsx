"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Send, CheckCircle } from "lucide-react";

const RECENT_MESSAGES = [
  {
    id: 1,
    recipientGroup: "All Members",
    message:
      "Reminder: Church Anniversary Celebration this Sunday at 10:00 AM. Please RSVP if you haven't already. God bless!",
    sentDate: "2026-05-20",
    status: "Delivered" as const,
  },
  {
    id: 2,
    recipientGroup: "Deacons",
    message:
      "Deacon Board meeting moved to Wednesday at 6:30 PM in the fellowship hall. Please confirm attendance.",
    sentDate: "2026-05-18",
    status: "Delivered" as const,
  },
  {
    id: 3,
    recipientGroup: "Ministry Leaders",
    message:
      "VBS planning meeting this Saturday at 9 AM. Bring your volunteer lists and supply requests.",
    sentDate: "2026-05-15",
    status: "Sent" as const,
  },
  {
    id: 4,
    recipientGroup: "All Members",
    message:
      "The church food pantry needs donations. Please bring non-perishable items this Sunday. Thank you for your generosity!",
    sentDate: "2026-05-10",
    status: "Delivered" as const,
  },
];

export default function SmsCenterPage() {
  const [recipientGroup, setRecipientGroup] = useState("");
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSend = () => {
    setShowSuccess(true);
    setMessage("");
    setRecipientGroup("");
    setSchedule("now");
    setScheduleDate("");
    setScheduleTime("");
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="SMS Center"
        description="Send text messages to church members"
      />

      {/* Compose Message */}
      <div className="space-y-6">
        <h2 className="font-heading text-xl font-semibold text-warm-900 dark:text-warm-50">
          Compose Message
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            {showSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-green-700 dark:text-green-300 text-sm">
                <CheckCircle className="h-4 w-4" />
                Message sent successfully!
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
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                placeholder="Type your message..."
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value.slice(0, 160))
                }
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
              disabled={!recipientGroup || !message}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Message
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
        <div className="space-y-3">
          {RECENT_MESSAGES.map((msg) => (
            <Card key={msg.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                      >
                        {msg.recipientGroup}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          msg.status === "Delivered"
                            ? "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                            : "border-warm-300 text-warm-600 dark:border-warm-600 dark:text-warm-400"
                        }
                      >
                        {msg.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-warm-700 dark:text-warm-300 truncate">
                      {msg.message}
                    </p>
                    <p className="text-xs text-warm-400">
                      Sent {new Date(msg.sentDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
