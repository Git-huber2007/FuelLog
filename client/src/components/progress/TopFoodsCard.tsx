import type { ProgressResponse } from '@fuellog/shared';

export function TopFoodsCard({ topFoods }: { topFoods: ProgressResponse['topFoods'] }) {
  const lists = [
    { title: 'Calories', unit: 'kcal', dot: 'bg-accent', items: topFoods.kcal },
    { title: 'Protein', unit: 'g', dot: 'bg-protein', items: topFoods.protein },
  ];
  return (
    <section className="card space-y-3" aria-labelledby="foods-title">
      <div>
        <h2 id="foods-title" className="card-title">Top foods</h2>
        <p className="mt-0.5 text-xs text-muted">What gave you the most over the last 7 days.</p>
      </div>
      {topFoods.kcal.length === 0 ? (
        <p className="text-sm text-muted">Log food on the Today tab and your biggest sources show here.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {lists.map((list) => (
            <div key={list.title} className="min-w-0">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold"><span className={`h-2 w-2 rounded-full ${list.dot}`} aria-hidden />{list.title}</h3>
              <ol className="mt-1 divide-y divide-line">
                {list.items.map((f) => (
                  <li key={f.name} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate" title={f.name}>{f.name}</span>
                    <span className="shrink-0 font-semibold">{f.value.toLocaleString()} {list.unit}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
