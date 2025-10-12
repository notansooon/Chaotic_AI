'use client';

import React, { useMemo } from "react";
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Warehouse,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import UsageChart from "./(components)/dashboard/UsageChart";
import ResourceTable from "./(components)/dashboard/ResourceTable";

type Resource = {
  id: string;
  name: string;
  type: string;
  status: "running" | "pending" | "stopped" | "error";
  node?: string;
  uptime?: string;
  cpu_usage?: number;
  memory_usage?: number;
  restarts: number;
};

type Garage = {
  id: string;
  name: string;
};

const sampleResources: Resource[] = [
  {
    id: "res-1",
    name: "Inference Node - Alpha",
    type: "container",
    status: "running",
    node: "alpha-01",
    uptime: "8h 21m",
    cpu_usage: 0.62,
    memory_usage: 1180,
    restarts: 0
  },
  {
    id: "res-2",
    name: "Batch Trainer",
    type: "job",
    status: "running",
    node: "trainer-02",
    uptime: "3h 04m",
    cpu_usage: 0.74,
    memory_usage: 1536,
    restarts: 1
  },
  {
    id: "res-3",
    name: "Vector Store",
    type: "database",
    status: "pending",
    node: "storage-01",
    uptime: "--",
    cpu_usage: 0.18,
    memory_usage: 640,
    restarts: 0
  },
  {
    id: "res-4",
    name: "Fleet Controller",
    type: "service",
    status: "error",
    node: "control-01",
    uptime: "1h 12m",
    cpu_usage: 0.09,
    memory_usage: 420,
    restarts: 3
  },
  {
    id: "res-5",
    name: "Synthetic Generator",
    type: "container",
    status: "running",
    node: "alpha-02",
    uptime: "12h 47m",
    cpu_usage: 0.58,
    memory_usage: 980,
    restarts: 0
  },
  {
    id: "res-6",
    name: "Legacy API",
    type: "service",
    status: "stopped",
    node: "edge-03",
    uptime: "--",
    cpu_usage: 0.0,
    memory_usage: 128,
    restarts: 4
  }
];

const sampleGarages: Garage[] = [
  { id: "garage-1", name: "Primary Compute" },
  { id: "garage-2", name: "Edge GPU Cluster" },
  { id: "garage-3", name: "Archive Region" }
];

const generateChartData = () => {
  const times: string[] = [];
  const now = new Date();

  for (let i = 23; i >= 0; i -= 1) {
    const time = new Date(now);
    time.setHours(time.getHours() - i);
    times.push(`${time.getHours()}:00`);
  }

  return times.map((time) => ({
    time,
    cpu: Math.random() * 0.15 + 0.25,
    memory: Math.random() * 250 + 600
  }));
};

export default function Dashboard() {
  const chartData = useMemo(() => generateChartData(), []);
  const resources = sampleResources;
  const garages = sampleGarages;
  const isLoading = false;

  const runningCount = resources.filter((r) => r.status === "running").length;
  const totalCpu = resources.reduce(
    (sum, r) => sum + (r.cpu_usage ?? 0),
    0
  );
  const totalMemory = resources.reduce(
    (sum, r) => sum + (r.memory_usage ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-6 py-8">
        <div className="bg-white rounded-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-blue-50 rounded-xl mb-3">
                <Server className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Resources
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold text-gray-900">
                  {resources.length}
                </h3>
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <ArrowUp className="w-4 h-4" />
                  +12%
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-green-50 rounded-xl mb-3">
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Running</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold text-gray-900">
                  {runningCount}
                </h3>
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <ArrowUp className="w-4 h-4" />
                  +5
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-indigo-50 rounded-xl mb-3">
                <Warehouse className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Garages</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {garages.length}
              </h3>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-purple-50 rounded-xl mb-3">
                <Cpu className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">CPU Usage</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900">
                  {totalCpu.toFixed(2)}
                </h3>
                <span className="text-sm text-gray-500">cores</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-orange-50 rounded-xl mb-3">
                <HardDrive className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Memory Usage
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {(totalMemory / 1024).toFixed(1)}
                  </h3>
                  <span className="text-sm text-gray-500">GB</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <ArrowDown className="w-4 h-4" />
                  -8%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UsageChart title="CPU Usage" data={chartData} dataKey="cpu" color="#3b82f6" />
          <UsageChart
            title="Memory Usage"
            data={chartData}
            dataKey="memory"
            color="#8b5cf6"
            unit=" Mi"
          />
        </div>

        <ResourceTable resources={resources} isLoading={isLoading} />
      </div>
    </div>
  );
}
