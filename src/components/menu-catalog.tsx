"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { PublicMenuItem } from "@/db/menu";
import { formatRupiah, getPublicMenuImageUrl } from "@/lib/site";
import styles from "@/app/(public)/menu/menu.module.css";

type MenuCategory = { id: string; name: string };

type MenuCatalogProps = {
  categories: MenuCategory[];
  items: PublicMenuItem[];
};

const allFilterId = "all";

export function MenuCatalog({ categories, items }: MenuCatalogProps) {
  const [activeFilter, setActiveFilter] = useState(allFilterId);
  const filters = [{ id: allFilterId, name: "All" }, ...categories];
  const displayedItems = useMemo(
    () => items.filter((item) => activeFilter === allFilterId || item.categoryId === activeFilter),
    [activeFilter, items],
  );

  return (
    <>
      <div className={styles.filters} aria-label="Filter menu category" role="tablist">
        {filters.map((filter) => <button aria-selected={filter.id === activeFilter} className={filter.id === activeFilter ? styles.activeFilter : ""} key={filter.id} onClick={() => setActiveFilter(filter.id)} role="tab" type="button">{filter.name}</button>)}
      </div>
      <div className={styles.menuGrid} key={activeFilter} data-enter="soft" data-stagger aria-live="polite" aria-atomic="true">
        {displayedItems.length ? displayedItems.map((item) => (
          <article className={styles.menuCard} key={item.id}>
            <div className={styles.menuImage}>{item.imageUrl ? <Image alt={`${item.name} at Kōhi Coffee`} fill sizes="(max-width: 760px) calc(100vw - 2.5rem), (max-width: 1100px) 44vw, 29vw" src={getPublicMenuImageUrl(item.imageUrl)} /> : null}</div>
            <div className={styles.itemMeta}>
              <p className={styles.category}>{item.categoryName}</p>
              {!item.isAvailable ? <span className={styles.soldOutBadge}>Sold out</span> : null}
            </div>
            <div className={styles.itemLine}><h2>{item.name}</h2><span>{formatRupiah(item.price)}</span></div>
            <p className={styles.description}>{item.description}</p>
          </article>
        )) : <p className={styles.emptyState}>No menu items in this category just yet.</p>}
      </div>
    </>
  );
}
