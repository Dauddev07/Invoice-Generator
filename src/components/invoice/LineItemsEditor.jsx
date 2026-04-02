import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Table, Th } from '../ui/Table'
import { Button } from '../ui/Button'
import { SortableLineRow } from './SortableLineRow'

export function LineItemsEditor({ items, onAdd, onUpdate, onRemove, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          onReorder(String(active.id), String(over.id))
        }
      }}
    >
      <Table>
        <thead>
          <tr>
            <Th className="is-line-th-drag" />
            <Th>Item</Th>
            <Th className="is-line-th-num">Qty</Th>
            <Th className="is-line-th-num">Rate</Th>
            <Th className="is-line-th-act" />
          </tr>
        </thead>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <tbody>
            {items.map((item) => (
              <SortableLineRow
                key={item.id}
                item={item}
                canRemove={items.length > 1}
                onUpdate={(p) => onUpdate(item.id, p)}
                onRemove={() => onRemove(item.id)}
              />
            ))}
          </tbody>
        </SortableContext>
      </Table>
      <div className="is-line-add">
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          + Add line item
        </Button>
      </div>
    </DndContext>
  )
}
