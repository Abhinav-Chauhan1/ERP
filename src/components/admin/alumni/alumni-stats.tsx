"use client";

/**
 * Alumni Statistics Component
 * 
 * Displays statistics dashboard with charts for distribution by year,
 * occupation, location, and summary cards.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.7
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Briefcase, MapPin } from "lucide-react";
import { SimpleBarChart, SimplePieChart } from "@/components/ui/charts";

export interface AlumniStatisticsData {
  totalAlumni: number;
  byGraduationYear: Record<number, number>;
  byOccupation: Record<string, number>;
  byCollege: Record<string, number>;
  byCity: Record<string, number>;
}

interface AlumniStatsProps {
  statistics: AlumniStatisticsData;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B9D",
  "#C084FC",
  "#34D399",
];

export function AlumniStats({ statistics }: AlumniStatsProps) {
  // Prepare data for graduation year chart
  const graduationYearData = Object.entries(statistics.byGraduationYear)
    .map(([year, count]) => ({
      year: parseInt(year),
      count,
    }))
    .sort((a, b) => a.year - b.year)
    .slice(-10); // Last 10 years

  // Prepare data for occupation chart (top 10)
  const occupationData = Object.entries(statistics.byOccupation)
    .map(([occupation, count]) => ({
      occupation: occupation || "Not Specified",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Prepare data for city chart (top 10)
  const cityData = Object.entries(statistics.byCity)
    .map(([city, count]) => ({
      city: city || "Not Specified",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Prepare data for college chart (top 10)
  const collegeData = Object.entries(statistics.byCollege)
    .map(([college, count]) => ({
      college: college || "Not Specified",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate some derived statistics
  const totalOccupations = Object.keys(statistics.byOccupation).length;
  const totalCities = Object.keys(statistics.byCity).length;
  const totalColleges = Object.keys(statistics.byCollege).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAlumni}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupations</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOccupations}</div>
            <p className="text-xs text-muted-foreground">
              Different career paths
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cities</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCities}</div>
            <p className="text-xs text-muted-foreground">
              Geographic spread
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colleges</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalColleges}</div>
            <p className="text-xs text-muted-foreground">
              Higher education institutions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Graduation Year Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Alumni by Graduation Year</CardTitle>
            <CardDescription>
              Distribution of alumni across recent graduation years
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={graduationYearData}
              dataKey="count"
              xAxisKey="year"
              fill="#8884d8"
              height={300}
              legendLabel="Alumni Count"
            />
          </CardContent>
        </Card>

        {/* Top Occupations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Occupations</CardTitle>
            <CardDescription>
              Most common career paths among alumni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={occupationData}
              dataKey="count"
              xAxisKey="occupation"
              fill="#82ca9d"
              height={300}
              legendLabel="Alumni Count"
            />
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle>Top Cities</CardTitle>
            <CardDescription>
              Geographic distribution of alumni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimplePieChart
              data={cityData}
              dataKey="count"
              nameKey="city"
              colors={COLORS}
              height={300}
            />
          </CardContent>
        </Card>

        {/* Top Colleges */}
        <Card>
          <CardHeader>
            <CardTitle>Top Colleges/Universities</CardTitle>
            <CardDescription>
              Most attended higher education institutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={collegeData}
              dataKey="count"
              xAxisKey="college"
              fill="#ffc658"
              height={300}
              legendLabel="Alumni Count"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
