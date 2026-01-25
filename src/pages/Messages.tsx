import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Bell, 
  Search,
  Send,
  Mail,
  Users,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";

// Mock data
const mentorConversations = [
  { 
    id: 1, 
    mentor: "Alex Chen", 
    avatar: "", 
    initials: "AC",
    lastMessage: "Great progress on the React project! Let's continue next week.", 
    time: "2h ago",
    unread: true,
    skill: "React"
  },
  { 
    id: 2, 
    mentor: "Sarah Williams", 
    avatar: "", 
    initials: "SW",
    lastMessage: "Here are some resources for your essay structure.", 
    time: "1d ago",
    unread: false,
    skill: "Writing"
  },
  { 
    id: 3, 
    mentor: "David Park", 
    avatar: "", 
    initials: "DP",
    lastMessage: "Don't forget to practice the algorithms we discussed!", 
    time: "3d ago",
    unread: false,
    skill: "Python"
  },
];

const notifications = [
  { 
    id: 1, 
    type: "booking", 
    title: "Session Confirmed", 
    message: "Your session with Alex Chen is confirmed for Jan 28 at 3:00 PM",
    time: "1h ago",
    read: false
  },
  { 
    id: 2, 
    type: "reminder", 
    title: "Upcoming Session", 
    message: "Reminder: You have a session with Sarah Williams tomorrow",
    time: "5h ago",
    read: false
  },
  { 
    id: 3, 
    type: "achievement", 
    title: "Badge Earned! 🏆", 
    message: "You've earned the 'Quick Learner' badge for completing 5 quizzes",
    time: "1d ago",
    read: true
  },
  { 
    id: 4, 
    type: "course", 
    title: "Course Update", 
    message: "New lesson added to 'JavaScript Fundamentals'",
    time: "2d ago",
    read: true
  },
];

const selectedConversation = {
  mentor: "Alex Chen",
  messages: [
    { id: 1, from: "mentor", text: "Hi! How's the React project going?", time: "Yesterday, 2:30 PM" },
    { id: 2, from: "user", text: "It's going well! I finished the component structure.", time: "Yesterday, 2:45 PM" },
    { id: 3, from: "mentor", text: "Awesome! Make sure to add proper error handling.", time: "Yesterday, 3:00 PM" },
    { id: 4, from: "user", text: "Will do! Should I use error boundaries?", time: "Yesterday, 3:15 PM" },
    { id: 5, from: "mentor", text: "Great progress on the React project! Let's continue next week.", time: "2h ago" },
  ]
};

function getNotificationIcon(type: string) {
  switch (type) {
    case "booking": return <Calendar className="w-5 h-5 text-primary" />;
    case "reminder": return <Bell className="w-5 h-5 text-amber-500" />;
    case "achievement": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    default: return <Mail className="w-5 h-5 text-accent" />;
  }
}

export default function Messages() {
  const [activeConversation, setActiveConversation] = useState(1);
  const [messageInput, setMessageInput] = useState("");

  return (
    <DashboardLayout>
      <div className="p-6 h-[calc(100vh-3.5rem)]">
        <Tabs defaultValue="mentors" className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Messages</h1>
              <p className="text-muted-foreground mt-1">
                Connect with mentors and stay updated
              </p>
            </div>
            <TabsList className="bg-secondary">
              <TabsTrigger value="mentors" className="gap-2">
                <Users className="w-4 h-4" />
                Mentors
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs justify-center">
                  2
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mentors Tab */}
          <TabsContent value="mentors" className="flex-1 mt-0">
            <div className="grid lg:grid-cols-3 gap-4 h-full">
              {/* Conversations List */}
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="p-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search conversations..." 
                      className="pl-9 bg-secondary border-none"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-2 space-y-1 overflow-y-auto max-h-[500px]">
                  {mentorConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv.id)}
                      className={`w-full p-3 rounded-xl text-left transition-colors ${
                        activeConversation === conv.id 
                          ? "bg-primary/10 border border-primary/20" 
                          : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.avatar} />
                          <AvatarFallback className="bg-secondary text-sm">
                            {conv.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{conv.mentor}</span>
                            <span className="text-xs text-muted-foreground">{conv.time}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs mt-0.5 mb-1">
                            {conv.skill}
                          </Badge>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unread && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="lg:col-span-2 bg-card border-border flex flex-col overflow-hidden">
                <CardHeader className="p-4 border-b border-border flex-row items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary">AC</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.mentor}</h3>
                    <p className="text-xs text-muted-foreground">React Mentor</p>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                  {selectedConversation.messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.from === "user" ? "justify-end" : ""}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.from === "user" 
                          ? "gradient-primary text-primary-foreground" 
                          : "bg-secondary"
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.from === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>

                <div className="p-4 border-t border-border">
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="hero" size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="flex-1 mt-0">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">All Notifications</CardTitle>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Mark all as read
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                      notif.read ? "bg-secondary/30" : "bg-secondary"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{notif.title}</h4>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
