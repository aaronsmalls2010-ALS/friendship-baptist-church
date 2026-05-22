"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FileEdit } from "lucide-react";

type Row = Record<string, unknown>;

interface CmsPage {
  title: string;
  slug: string;
  status: "published" | "draft";
  lastEdited: string;
}

const CMS_PAGES: CmsPage[] = [
  { title: "Homepage", slug: "/", status: "published", lastEdited: "2026-05-20" },
  { title: "About", slug: "/about", status: "published", lastEdited: "2026-05-18" },
  { title: "Welcome", slug: "/welcome", status: "published", lastEdited: "2026-05-15" },
  { title: "Pastor", slug: "/pastor", status: "draft", lastEdited: "2026-05-10" },
  { title: "Give", slug: "/give", status: "published", lastEdited: "2026-05-08" },
  { title: "Contact", slug: "/contact", status: "published", lastEdited: "2026-05-05" },
];

export default function ContentManagementPage() {
  const columns = [
    { key: "title", label: "Title" },
    { key: "slug", label: "Slug" },
    {
      key: "status",
      label: "Status",
      render: (row: Row) => {
        const item = row as unknown as CmsPage;
        return item.status === "published" ? (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-transparent">
            Published
          </Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-transparent">
            Draft
          </Badge>
        );
      },
    },
    {
      key: "lastEdited",
      label: "Last Edited",
      render: (row: Row) =>
        formatDate((row as unknown as CmsPage).lastEdited),
    },
    {
      key: "actions",
      label: "Actions",
      render: () => (
        <Button variant="outline" size="sm">
          <FileEdit className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Content Management"
        description="Edit website pages and content"
      />

      <DataTable
        data={CMS_PAGES as unknown as Record<string, unknown>[]}
        columns={columns}
        searchable
        searchKeys={["title", "slug"]}
      />
    </div>
  );
}
