import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function SortableLineRow({ item, onUpdate, onRemove, canRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className="is-line-row">
      <td className="is-line-row__drag">
        <button
          type="button"
          className="is-drag-handle"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      </td>
      <td>
        <Input
          compact
          aria-label="Description"
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Service or product"
        />
      </td>
      <td>
        <Input
          compact
          type="number"
          min={0}
          step="any"
          aria-label="Quantity"
          value={item.quantity}
          onChange={(e) => onUpdate({ quantity: parseFloat(e.target.value) || 0 })}
        />
      </td>
      <td>
        <Input
          compact
          type="number"
          min={0}
          step="any"
          aria-label="Rate"
          value={item.rate}
          onChange={(e) => onUpdate({ rate: parseFloat(e.target.value) || 0 })}
        />
      </td>
      <td className="is-line-row__actions">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label="Remove line"
        >
          ×
        </Button>
      </td>
    </tr>
  )
}
