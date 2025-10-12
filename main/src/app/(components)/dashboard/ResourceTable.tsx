import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Clock, XCircle, MoreVertical, TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const statusConfig = {
  running: { icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50", label: "Running" },
  pending: { icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-50", label: "Pending" },
  stopped: { icon: XCircle, color: "text-gray-600", bgColor: "bg-gray-50", label: "Stopped" },
  error: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50", label: "Error" },
};

export default function ResourceTable({ resources, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Resources</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {resources.length} total
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Node</TableHead>
                <TableHead className="font-semibold">Uptime</TableHead>
                <TableHead className="font-semibold">CPU</TableHead>
                <TableHead className="font-semibold">Memory</TableHead>
                <TableHead className="font-semibold">Restarts</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => {
                const status = statusConfig[resource.status];
                const StatusIcon = status.icon;
                const cpuPercent = (resource.cpu_usage || 0) * 100;
                const memoryPercent = ((resource.memory_usage || 0) / 2048) * 100;
                
                return (
                  <TableRow key={resource.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {resource.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {resource.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.bgColor}`}>
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{resource.node || '-'}</TableCell>
                    <TableCell className="text-gray-600">{resource.uptime || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {resource.cpu_usage !== undefined && (
                          <>
                            <div className="w-20">
                              <Progress value={cpuPercent} className="h-2" />
                            </div>
                            <span className="text-sm text-gray-600 min-w-[3rem]">
                              {resource.cpu_usage.toFixed(2)}
                            </span>
                            {cpuPercent > 80 ? (
                              <TrendingUp className="w-4 h-4 text-red-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-green-500" />
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {resource.memory_usage !== undefined && (
                          <>
                            <div className="w-20">
                              <Progress value={memoryPercent} className="h-2" />
                            </div>
                            <span className="text-sm text-gray-600 min-w-[3rem]">
                              {resource.memory_usage.toFixed(0)} Mi
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={resource.restarts > 0 ? "destructive" : "secondary"}>
                        {resource.restarts}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}