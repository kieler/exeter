"use client";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import NextLink from "@/components/next-link";
import type { RecordedEvent } from "@/lib/events";
import { formatDateTime } from "@/lib/format-date-time";
import { getEventPath } from "@/routes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const ALL_SOURCES = "__all_sources__";
const ALL_KINDS = "__all_kinds__";

/** Displays every event of a session with source filtering and grid controls. */
export function EventsTable({ events }: { events: readonly RecordedEvent[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 100 });
  const sources = useMemo(() => [...new Set(events.map((event) => event.type))].sort(), [events]);
  const kinds = useMemo(() => [...new Set(events.map((event) => actionKind(event.data)))].sort(), [events]);
  const selectedSources = searchParams.getAll("source").filter((source) => sources.includes(source));
  const selectedKinds = searchParams.getAll("kind").filter((kind) => kinds.includes(kind));
  const filteredEvents = selectedSources.length === 0
    ? events
    : events.filter((event) => selectedSources.includes(event.type));
  const sourceAndKindFilteredEvents = selectedKinds.length === 0
    ? filteredEvents
    : filteredEvents.filter((event) => selectedKinds.includes(actionKind(event.data)));

  function updateSources(event: SelectChangeEvent<string[]>): void {
    updateFilter("source", ALL_SOURCES, event);
  }

  function updateKinds(event: SelectChangeEvent<string[]>): void {
    updateFilter("kind", ALL_KINDS, event);
  }

  function updateFilter(parameter: "source" | "kind", allOption: string, event: SelectChangeEvent<string[]>): void {
    const value = typeof event.target.value === "string"
      ? event.target.value.split(",")
      : event.target.value;
    const nextValues = value.includes(allOption) ? [] : value;
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete(parameter);
    nextValues.forEach((value) => nextSearchParams.append(parameter, value));

    const query = nextSearchParams.toString();
    setPaginationModel((model) => ({ ...model, page: 0 }));
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="event-source-filter-label">Source</InputLabel>
          <Select
            labelId="event-source-filter-label"
            id="event-source-filter"
            multiple
            value={selectedSources}
            onChange={updateSources}
            label="Source"
            renderValue={(selected) => selected.length === 0 ? "All sources" : selected.join(", ")}
          >
            <MenuItem value={ALL_SOURCES}>
              <Checkbox checked={selectedSources.length === 0} />
              <ListItemText primary="All sources" />
            </MenuItem>
            {sources.map((source) => (
              <MenuItem key={source} value={source}>
                <Checkbox checked={selectedSources.includes(source)} />
                <ListItemText primary={source} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="event-kind-filter-label">Kind</InputLabel>
          <Select
            labelId="event-kind-filter-label"
            id="event-kind-filter"
            multiple
            value={selectedKinds}
            onChange={updateKinds}
            label="Kind"
            renderValue={(selected) => selected.length === 0 ? "All kinds" : selected.join(", ")}
          >
            <MenuItem value={ALL_KINDS}>
              <Checkbox checked={selectedKinds.length === 0} />
              <ListItemText primary="All kinds" />
            </MenuItem>
            {kinds.map((kind) => (
              <MenuItem key={kind} value={kind}>
                <Checkbox checked={selectedKinds.includes(kind)} />
                <ListItemText primary={kind} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ minHeight: 420, width: "100%" }}>
        <DataGrid
          rows={sourceAndKindFilteredEvents}
          columns={columns}
          getRowId={(event) => event.id}
          disableRowSelectionOnClick
          pagination
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          slots={{ noRowsOverlay: NoRowsOverlay }}
          sx={{ width: "100%" }}
        />
      </Box>
    </Stack>
  );
}

const columns: GridColDef<RecordedEvent>[] = [
  { field: "sequence", headerName: "Sequence", type: "number", width: 100, align: "right", headerAlign: "right" },
  { field: "type", headerName: "Source", width: 130 },
  {
    field: "occurredAt",
    headerName: "Occurred at",
    type: "dateTime",
    width: 190,
    renderCell: (params) => formatDateTime(params.row.occurredAt),
  },
  { field: "eventType", headerName: "Type", width: 150, valueGetter: (_value, row) => eventType(row.data) },
  { field: "kind", headerName: "Kind", minWidth: 180, flex: 1, valueGetter: (_value, row) => actionKind(row.data) },
  {
    field: "content",
    headerName: "Content",
    minWidth: 280,
    flex: 2,
    sortable: false,
    filterable: false,
    renderCell: (params) => formatEventSnippet(params.row.data),
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 88,
    align: "center",
    headerAlign: "center",
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => (
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Tooltip title="View event">
          <IconButton component={NextLink} href={getEventPath(params.row.id)} aria-label="View event">
            <VisibilityOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

function NoRowsOverlay() {
  return <Box sx={{ p: 3, textAlign: "center" }}>No events match the selected filters.</Box>;
}

function eventType(data: unknown): string {
  return stringProperty(data, "type");
}

function actionKind(data: unknown): string {
  return stringProperty(objectProperty(data, "action"), "kind");
}

function stringProperty(value: unknown, property: string): string {
  const propertyValue = objectProperty(value, property);
  return typeof propertyValue === "string" ? propertyValue : "—";
}

function objectProperty(value: unknown, property: string): unknown {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>)[property] : undefined;
}

function formatEventSnippet(data: unknown): string {
  return JSON.stringify(data) ?? "null";
}
