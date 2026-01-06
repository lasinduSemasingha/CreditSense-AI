"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { uploadKnowledgeFromExcel } from "@/lib/services/knowledge-base-service";

type Doc = { id: string; content: string; title?: string | null };

export function KnowledgeBaseManager() {
  const [knowledge, setKnowledge] = useState<Doc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Doc | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [lastActionAt, setLastActionAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load documents
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/kb");
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Doc[];
        if (active) setKnowledge(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load knowledge base");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredKnowledge = useMemo(
    () =>
      knowledge.filter((item) =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [knowledge, searchQuery]
  );

  const handleAdd = () => {
    void (async () => {
      const text = formData.content.trim();
      const title = (formData.title || "").trim() || text.slice(0, 80);
      if (!text) return;
      try {
        setLoading(true);
        const res = await fetch("/api/kb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content: text }),
        });
        if (!res.ok) throw new Error(await res.text());
  const created = (await res.json()) as Doc;
        setKnowledge((prev) => [created, ...prev]);
        setIsAddDialogOpen(false);
  setFormData({ title: "", content: "" });
        setLastActionAt(Date.now());
        toast.success("Added to knowledge base");
      } catch (e) {
        console.error(e);
        toast.error("Failed to add item");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleEdit = (item: Doc) => {
    setEditingItem(item);
    setFormData({ title: item.title ?? "", content: item.content });
    setIsEditDialogOpen(true);
  };
/*updated*/
  const handleUpdate = () => {
    if (!editingItem) return;
    void (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/kb", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, title: (formData.title || "").trim() || formData.content.trim().slice(0,80), content: formData.content }),
        });
        if (!res.ok) throw new Error(await res.text());
        const updated = (await res.json()) as Doc;
        setKnowledge((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setEditingItem(null);
  setFormData({ title: "", content: "" });
        setIsEditDialogOpen(false);
        setLastActionAt(Date.now());
        toast.success("Updated");
      } catch (e) {
        console.error(e);
        toast.error("Failed to update item");
      } finally {
        setLoading(false);
      }
    })();
  };
/*deleted*/
  const handleDelete = (id: string) => {
    void (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/kb?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 204) throw new Error(await res.text());
        setKnowledge((prev) => prev.filter((item) => item.id !== id));
        setLastActionAt(Date.now());
        toast.success("Deleted");
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete item");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleBulkUpload = () => {
    const node = fileInputRef.current;
    if (!node) return;
    node.value = ""; // reset so same file can be re-selected
    node.click();
  };

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void (async () => {
      try {
        setLoading(true);
        const created = await uploadKnowledgeFromExcel(file);
        setKnowledge((prev) => [...created, ...prev]);
        setLastActionAt(Date.now());
        toast.success(`Uploaded ${created.length} knowledge items`);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Failed to upload file");
      } finally {
        setLoading(false);
      }
    })();
  };

  const apiStatus = loading ? "Loading" : "Ready";

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Knowledge</DialogTitle>
                <DialogDescription>
                  Add new information to the AI assistant knowledge base
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Short label for this content"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter the detailed information..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!formData.content.trim() || loading}
                >
                  Add Knowledge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleBulkUpload} disabled={loading}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Excel/CSV
            </Button>
            <a
              href="/templates/knowledge-base-template.csv"
              download
              className="text-sm text-primary hover:underline"
            >
              Download template
            </a>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              onChange={onFileSelected}
            />
          </div>
        </div>

        {/* <div className="grid gap-4 md:grid-cols-4"> */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{knowledge.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiStatus}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredKnowledge.length}</div>
            </CardContent>
          </Card>
          {/* <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {lastActionAt ? new Date(lastActionAt).toLocaleString() : "N/A"}
              </div>
            </CardContent>
          </Card> */}
        </div>

        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="space-y-4">
            {filteredKnowledge.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {item.title || "Untitled"}
                        </CardTitle>
                      </div>
                      {/* <CardDescription>Content only</CardDescription> */}
                    </div>
                    <div className="flex gap-2">
                      <Dialog
                        open={isEditDialogOpen && editingItem?.id === item.id}
                        onOpenChange={(open) => {
                          setIsEditDialogOpen(open);
                          if (!open) {
                            setEditingItem(null);
                            setFormData({ title: "", content: "" });
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Knowledge</DialogTitle>
                            <DialogDescription>
                              Update the information in the knowledge base
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-title">Title</Label>
                              <Input
                                id="edit-title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-content">Content</Label>
                              <Textarea
                                id="edit-content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={6}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingItem(null);
                                setFormData({ title: "", content: "" });
                                setIsEditDialogOpen(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleUpdate} disabled={!formData.content.trim() || loading}>
                              Update Knowledge
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete knowledge item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the item from the knowledge base.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(item.id)}
                              disabled={loading}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {item.content}
                  </p>
                </CardContent>
              </Card>
            ))}

            {filteredKnowledge.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No knowledge items found matching your search.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
