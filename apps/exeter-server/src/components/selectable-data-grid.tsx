"use client";

import Box from "@mui/material/Box";
import { DataGrid, type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid";
import { useState } from "react";
import { HeaderDeleteRecordsForm, type DeleteRecordsAction } from "@/components/delete-records-form";

interface SelectableDataGridProps<Row extends { id: string }> {
  rows: readonly Row[];
  columns: readonly GridColDef<Row>[];
  emptyMessage: string;
  deleteAction: DeleteRecordsAction;
  deleteActionTargetId: string;
  deleteConfirmation: (selectedRows: readonly Row[]) => string;
  isDeleteDisabled?: (selectedRows: readonly Row[]) => boolean;
}

/**
 * Shared MUI grid for record lists with checkbox selection and a header-mounted
 * bulk-delete action.
 */
export function SelectableDataGrid<Row extends { id: string }>({
  rows,
  columns,
  emptyMessage,
  deleteAction,
  deleteActionTargetId,
  deleteConfirmation,
  isDeleteDisabled = () => false,
}: SelectableDataGridProps<Row>) {
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set<string>(),
  });
  const selectedRows = rows.filter((row) => selectionModel.ids.has(row.id));
  const selectedIds = selectedRows.map((row) => row.id);

  return (
    <Box sx={{ minHeight: 420, width: "100%" }}>
      <HeaderDeleteRecordsForm
        targetId={deleteActionTargetId}
        action={deleteAction}
        ids={selectedIds}
        label={`Delete selected${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
        confirmation={deleteConfirmation(selectedRows)}
        disabled={isDeleteDisabled(selectedRows)}
      />
      <DataGrid
        rows={rows}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        disableRowSelectionExcludeModel
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={setSelectionModel}
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
        localeText={{ noRowsLabel: emptyMessage }}
      />
    </Box>
  );
}
