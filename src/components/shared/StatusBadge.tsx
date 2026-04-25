import type { BookingStatus } from '../../types';
import { getStatusLabel, getStatusColor } from '../../utils';

interface Props {
  status: BookingStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`badge ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}
