import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Zap, 
  Database, 
  Server, 
  Wifi,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";

interface SystemHealthOverviewProps {
  systemHealth?: {
    uptime: number;
    avgResponseTime: number;
    status: "healthy" | "warning" | "critical";
  };
}

export function SystemHealthOverview({ systemHealth }: SystemHealthOverviewProps) {
  const health = systemHealth || {
    uptime: 99.97,
    avgResponseTime: 145,
    status: "healthy" as const
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "warning":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "critical":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Mock data for system components
  const systemComponents = [
    { name: "API Server", status: "healthy", uptime: 99.98, responseTime: 120 },
    { name: "Database", status: "healthy", uptime: 99.95, responseTime: 45 },
    { name: "File Storage", status: "healthy", uptime: 99.99, responseTime: 80 },
    { name: "Email Service", status: "healthy", uptime: 99.90, responseTime: 200 },
    { name: "SMS Gateway", status: "warning", uptime: 98.50, responseTime: 350 },
  ];

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">System Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className={getStatusColor(health.status)}>
                    {getStatusIcon(health.status)}
                    <span className="ml-1 capitalize">{health.status}</span>
                  </Badge>
                </div>
              </div>
              <Activity className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Uptime</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {health.uptime}%
                </p>
                <Progress value={health.uptime} className="h-2 mt-2" />
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {health.avgResponseTime}ms
                </p>
                <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Components */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Server className="h-5 w-5 mr-2 text-blue-600" />
            System Components
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemComponents.map((component) => (
              <div
                key={component.name}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 dark:bg-slate-700/50"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    component.status === "healthy" 
                      ? "bg-green-100 dark:bg-green-900" 
                      : "bg-yellow-100 dark:bg-yellow-900"
                  }`}>
                    {component.name === "Database" && <Database className="h-4 w-4 text-green-600" />}
                    {component.name === "API Server" && <Server className="h-4 w-4 text-green-600" />}
                    {component.name === "File Storage" && <Database className="h-4 w-4 text-green-600" />}
                    {component.name === "Email Service" && <Wifi className="h-4 w-4 text-green-600" />}
                    {component.name === "SMS Gateway" && <Wifi className="h-4 w-4 text-yellow-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{component.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {component.uptime}% uptime • {component.responseTime}ms avg
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(component.status)}
                >
                  {getStatusIcon(component.status)}
                  <span className="ml-1 capitalize">{component.status}</span>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            System Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="p-3 text-left rounded-lg bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
              <Activity className="h-5 w-5 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">View Logs</p>
            </button>
            <button className="p-3 text-left rounded-lg bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 transition-colors">
              <Database className="h-5 w-5 text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-900 dark:text-green-100">DB Status</p>
            </button>
            <button className="p-3 text-left rounded-lg bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors">
              <Server className="h-5 w-5 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Server Info</p>
            </button>
            <button className="p-3 text-left rounded-lg bg-orange-50 dark:bg-orange-950 hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">
              <Zap className="h-5 w-5 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Performance</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}