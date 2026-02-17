"use client";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  Mail, 
  Send, 
  Reply, 
  Forward, 
  Trash2, 
  Archive, 
  Star, 
  Search,
  Inbox,
  SendHorizontal,
  FileText,
} from "lucide-react";

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'archive';
  attachments?: string[];
}

interface EmailFolder {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  type: 'inbox' | 'sent' | 'drafts' | 'archive';
}

export default function EmailClient() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'drafts' | 'archive'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  });

  
  const folders: EmailFolder[] = [
    { id: 'inbox', name: 'Inbox', icon: <Inbox size={16} />, count: emails.filter(e => e.folder === 'inbox' && !e.isRead).length, type: 'inbox' },
    { id: 'sent', name: 'Sent', icon: <SendHorizontal size={16} />, count: emails.filter(e => e.folder === 'sent').length, type: 'sent' },
    { id: 'drafts', name: 'Drafts', icon: <FileText size={16} />, count: emails.filter(e => e.folder === 'drafts').length, type: 'drafts' },
    { id: 'archive', name: 'Archive', icon: <Archive size={16} />, count: emails.filter(e => e.folder === 'archive').length, type: 'archive' }
  ];

  const filteredEmails = emails.filter(email => 
    email.folder === selectedFolder &&
    (email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
     email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
     email.body.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSendEmail = () => {
    const newEmail: Email = {
      id: Date.now().toString(),
      subject: composeData.subject,
      from: 'you@company.com',
      to: [composeData.to],
      body: composeData.body,
      timestamp: new Date().toISOString(),
      isRead: true,
      isStarred: false,
      folder: 'sent'
    };
    setEmails([...emails, newEmail]);
    setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
    setIsComposing(false);
  };

  const handleMarkAsRead = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, isRead: true } : email
    ));
  };

  const handleToggleStar = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
    ));
  };

  const handleDelete = (emailId: string) => {
    setEmails(emails.filter(email => email.id !== emailId));
    setSelectedEmail(null);
  };

  const handleArchive = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, folder: 'archive' } : email
    ));
    setSelectedEmail(null);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-6">
          <Button 
            onClick={() => setIsComposing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Mail size={16} className="mr-2" />
            Compose
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <nav className="space-y-1">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.type)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedFolder === folder.type 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {folder.icon}
                <span className="font-medium">{folder.name}</span>
              </div>
              {folder.count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {folder.count}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Email List */}
      <div className="w-96 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold capitalize">{selectedFolder}</h2>
          <p className="text-sm text-gray-500">{filteredEmails.length} messages</p>
        </div>
        
        <div className="overflow-y-auto h-full">
          {filteredEmails.map(email => (
            <div
              key={email.id}
              onClick={() => {
                setSelectedEmail(email);
                handleMarkAsRead(email.id);
              }}
              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedEmail?.id === email.id ? 'bg-blue-50' : ''
              } ${!email.isRead ? 'bg-blue-50/30' : ''}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!email.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                    {email.from}
                  </p>
                  <p className={`text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 truncate`}>
                    {email.subject}
                  </p>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {email.body.substring(0, 100)}...
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(email.timestamp)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(email.id);
                    }}
                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <Star size={14} fill={email.isStarred ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
              {email.attachments && email.attachments.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <FileText size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {selectedEmail.subject}
                </h1>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Reply size={16} className="mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" size="sm">
                    <Forward size={16} className="mr-2" />
                    Forward
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleArchive(selectedEmail.id)}
                  >
                    <Archive size={16} className="mr-2" />
                    Archive
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(selectedEmail.id)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">From: {selectedEmail.from}</p>
                  <p className="text-sm text-gray-500">To: {selectedEmail.to.join(', ')}</p>
                  {selectedEmail.cc && (
                    <p className="text-sm text-gray-500">Cc: {selectedEmail.cc.join(', ')}</p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(selectedEmail.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedEmail.body}</p>
              </div>
              
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText size={16} />
                        <span>{attachment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Select an email to read</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={isComposing} onOpenChange={setIsComposing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="To"
                value={composeData.to}
                onChange={(e) => setComposeData({...composeData, to: e.target.value})}
              />
            </div>
            <div>
              <Input
                placeholder="Cc"
                value={composeData.cc}
                onChange={(e) => setComposeData({...composeData, cc: e.target.value})}
              />
            </div>
            <div>
              <Input
                placeholder="Subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
              />
            </div>
            <div>
              <Textarea
                placeholder="Write your message..."
                value={composeData.body}
                onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                rows={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsComposing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail}>
                <Send size={16} className="mr-2" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
