

/*
import React, { useState, useEffect } from "react";
import { User } from "../../(components)/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Link2, 
  Trash2,
  Save,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email_discussions: true,
    email_peerpoints: true,
    email_events: false,
    push_projects: true,
    push_messages: true,
    weekly_digest: true
  });
  const [privacy, setPrivacy] = useState({
    profile_visible: true,
    show_activity: true,
    show_projects: true,
    allow_messages: true
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      setNotifications({
        email_discussions: userData.notifications?.email_discussions ?? true,
        email_peerpoints: userData.notifications?.email_peerpoints ?? true,
        email_events: userData.notifications?.email_events ?? false,
        push_projects: userData.notifications?.push_projects ?? true,
        push_messages: userData.notifications?.push_messages ?? true,
        weekly_digest: userData.notifications?.weekly_digest ?? true
      });
      
      setPrivacy({
        profile_visible: userData.privacy?.profile_visible ?? true,
        show_activity: userData.privacy?.show_activity ?? true,
        show_projects: userData.privacy?.show_projects ?? true,
        allow_messages: userData.privacy?.allow_messages ?? true
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setIsLoading(false);
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData({ notifications });
      setUser(prev => ({ ...prev, notifications }));
    } catch (error) {
      console.error("Error saving notifications:", error);
    }
    setIsSaving(false);
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData({ privacy });
      setUser(prev => ({ ...prev, privacy }));
    } catch (error) {
      console.error("Error saving privacy settings:", error);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-slate-700" />
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        </div>
        <p className="text-slate-600">Manage your account preferences and profile information</p>
      </motion.div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-xl shadow-sm mb-8">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Discussion Updates</Label>
                    <p className="text-sm text-slate-500">Get notified when someone replies to your discussions</p>
                  </div>
                  <Switch
                    checked={notifications.email_discussions}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_discussions: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>PeerPoint Requests</Label>
                    <p className="text-sm text-slate-500">Get notified about new PeerPoint opportunities</p>
                  </div>
                  <Switch
                    checked={notifications.email_peerpoints}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_peerpoints: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Event Invitations</Label>
                    <p className="text-sm text-slate-500">Get notified about upcoming events</p>
                  </div>
                  <Switch
                    checked={notifications.email_events}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_events: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-slate-500">Get a weekly summary of platform activity</p>
                  </div>
                  <Switch
                    checked={notifications.weekly_digest}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weekly_digest: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Projects</Label>
                    <p className="text-sm text-slate-500">Get notified about relevant project opportunities</p>
                  </div>
                  <Switch
                    checked={notifications.push_projects}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push_projects: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Direct Messages</Label>
                    <p className="text-sm text-slate-500">Get notified when someone messages you</p>
                  </div>
                  <Switch
                    checked={notifications.push_messages}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push_messages: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveNotifications} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Notification Preferences'}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="privacy">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Profile</Label>
                    <p className="text-sm text-slate-500">Make your profile visible to other users</p>
                  </div>
                  <Switch
                    checked={privacy.profile_visible}
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, profile_visible: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Activity</Label>
                    <p className="text-sm text-slate-500">Display your recent activity on your profile</p>
                  </div>
                  <Switch
                    checked={privacy.show_activity}
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_activity: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Projects</Label>
                    <p className="text-sm text-slate-500">Display projects you're involved in</p>
                  </div>
                  <Switch
                    checked={privacy.show_projects}
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, show_projects: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Messages</Label>
                    <p className="text-sm text-slate-500">Allow other users to send you direct messages</p>
                  </div>
                  <Switch
                    checked={privacy.allow_messages}
                    onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, allow_messages: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSavePrivacy} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="account">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base">Email Address</Label>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-base">Account Type</Label>
                    <p className="text-sm text-slate-500">Free Plan</p>
                  </div>
                  <Button variant="outline" size="sm">Upgrade</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <Label className="text-base text-red-800">Delete Account</Label>
                  <p className="text-sm text-red-600 mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
  */