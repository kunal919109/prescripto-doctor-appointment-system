import React from 'react';

/**
 * Skeleton table row for loading states.
 * Default 5 columns matches the appointment table layout:
 * patient name | doctor name | date | fee | status
 *
 * @param {number} cols - number of columns (default 5)
 */
const SkeletonRow = ({ cols = 5 }) => (
  <tr className="animate-pulse border-b border-gray-100" aria-hidden="true">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div
          className={`h-3 bg-gray-200 rounded ${
            i === 0 ? 'w-32' :       // patient name
            i === 1 ? 'w-28' :       // doctor name
            i === 2 ? 'w-24' :       // date
            i === 3 ? 'w-14' :       // fee
            'w-16'                   // status
          }`}
        />
      </td>
    ))}
  </tr>
);

export default SkeletonRow;
