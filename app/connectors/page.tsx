"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ConnectorManager from '@/components/connector-manager';
import { Card } from '@/components/ui/card';

export default function ConnectorsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-400">Please sign in to manage your connectors.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Connector Management</h1>
            <p className="text-gray-200">
              Connect your favorite tools and services to enable AI-powered automation.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 shrink-0"
          >
            Back to chat
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <div className="p-6">
              <ConnectorManager />
            </div>
          </Card>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
                <div className="space-y-4 text-sm text-gray-200">
                  <div>
                    <h4 className="font-medium text-white mb-1">Meta Tools Architecture</h4>
                    <p>Instead of loading all tools into context, your agent gets 5 meta tools that dynamically discover, authenticate, and execute actions across your selected toolkits.</p>
                  </div>
                  <div className="space-y-2 pl-3 border-l border-white/10">
                    <p><span className="text-emerald-400 font-medium">SEARCH_TOOLS</span> — Discover relevant tools across selected apps</p>
                    <p><span className="text-emerald-400 font-medium">MANAGE_CONNECTIONS</span> — Handle OAuth and API key auth on-demand</p>
                    <p><span className="text-emerald-400 font-medium">MULTI_EXECUTE</span> — Execute up to 20 tools in parallel</p>
                    <p><span className="text-emerald-400 font-medium">WORKBENCH</span> — Run Python code in a persistent sandbox</p>
                    <p><span className="text-emerald-400 font-medium">BASH_TOOL</span> — Execute bash commands for data processing</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
                <div className="space-y-4 text-sm text-gray-200">
                  <div>
                    <h4 className="font-medium text-white mb-1">1. Select Toolkits</h4>
                    <p>Browse and select the toolkits you want above. Use Search, category filters, or Select All.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">2. Ask the Agent</h4>
                    <p>Just ask — the agent will search for the right tool, prompt you to authenticate if needed, and execute the action.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h3 className="text-yellow-300 font-medium mb-2">Security & Privacy</h3>
            <p className="text-yellow-100 text-sm">
              All connections are encrypted and stored securely. You can disconnect any service at any time. 
              Connected services are only used when you explicitly request actions through the AI assistant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
