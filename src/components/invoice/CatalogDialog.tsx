import * as React from "react";
import {
  PackagePlus,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  Tag,
  FolderOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  listCatalogItems,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  type CatalogItem,
} from "@/lib/documentStore";
import { toast } from "sonner";

interface CatalogDialogProps {
  onSelectItem: (item: { desc: string; qty: number; price: number; sku?: string }) => void;
  currencySymbol?: string;
}

export const CatalogDialog: React.FC<CatalogDialogProps> = ({
  onSelectItem,
  currencySymbol = "$",
}) => {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");

  // Create/Edit item mode
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [sku, setSku] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [defaultPrice, setDefaultPrice] = React.useState<number>(100);
  const [category, setCategory] = React.useState("Services");

  const loadItems = React.useCallback(async () => {
    const data = await listCatalogItems();
    setItems(data);
  }, []);

  React.useEffect(() => {
    if (open) {
      void loadItems();
    }
  }, [open, loadItems]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ["All", ...Array.from(set)];
  }, [items]);

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchQuery =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [items, selectedCategory, search]);

  const handleSaveItem = async () => {
    if (!name.trim()) {
      toast.error("Item name is required");
      return;
    }

    if (editingId) {
      await updateCatalogItem(editingId, {
        sku,
        name,
        description,
        defaultPrice,
        category,
      });
      toast.success("Catalog item updated");
    } else {
      await createCatalogItem({
        sku,
        name,
        description,
        defaultPrice,
        category,
      });
      toast.success("New item added to catalog");
    }

    resetForm();
    await loadItems();
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setSku("");
    setName("");
    setDescription("");
    setDefaultPrice(100);
    setCategory("Services");
  };

  const handleEditClick = (e: React.MouseEvent, item: CatalogItem) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingId(item.id);
    setSku(item.sku);
    setName(item.name);
    setDescription(item.description);
    setDefaultPrice(item.defaultPrice);
    setCategory(item.category);
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteCatalogItem(id);
    toast.info("Item removed from catalog");
    await loadItems();
  };

  const handleInsert = (item: CatalogItem) => {
    onSelectItem({
      desc: item.name + (item.description ? ` - ${item.description}` : ""),
      qty: 1,
      price: item.defaultPrice,
      sku: item.sku,
    });
    toast.success(`Inserted "${item.name}"`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border/80">
          <PackagePlus className="w-3.5 h-3.5 text-blue-500" />
          <span>Catalog Presets</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-blue-500" />
            <span>Service & Product Catalog</span>
          </DialogTitle>
          <DialogDescription>
            Quickly insert pre-configured billing items, services, rates, and SKUs into this invoice.
          </DialogDescription>
        </DialogHeader>

        {!isEditing ? (
          <div className="space-y-3 pt-2">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search SKU or service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs h-8 pl-8"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="text-[11px] h-7 px-2"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="text-[11px] h-7 gap-1 px-2 shrink-0 ml-auto"
                >
                  <Plus className="w-3 h-3" />
                  New Item
                </Button>
              </div>
            </div>

            {/* Catalog Items List */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg text-xs text-muted-foreground">
                  No catalog items found. Click "New Item" to create one.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleInsert(item)}
                    className="group flex items-center justify-between p-3 rounded-lg border bg-card/60 hover:bg-primary/5 hover:border-primary/40 cursor-pointer transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground truncate">{item.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-mono">
                          {item.sku}
                        </Badge>
                        {item.category && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-sm text-foreground">
                        {currencySymbol}
                        {item.defaultPrice.toFixed(2)}
                      </span>

                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => handleEditClick(e, item)}
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteClick(e, item.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Create / Edit Form */
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Item / SKU Code</label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. SR-ENG-01"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Services, Retainer, Hardware"
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Name / Title</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Principal Software Architecture Sprint"
                className="text-xs h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Default Unit Rate ({currencySymbol})</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(Number(e.target.value) || 0)}
                className="text-xs h-8 max-w-[200px]"
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope of work, deliverable details, or service specifications..."
                className="w-full text-xs rounded-md border px-3 py-2 bg-background min-h-[64px]"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button size="sm" variant="ghost" onClick={resetForm} className="text-xs h-8">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveItem} className="text-xs h-8 gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {editingId ? "Update Item" : "Save to Catalog"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
