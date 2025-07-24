import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export default function CategoryListCard({ title, list, type }) {
  if (!list) return null;

  // Food category: render by day and meal
  if (type === 'food' && Array.isArray(list.items)) {
    // Use same table width and column alignment as other lists
    const foodColumns = [
      { key: 'meal', label: 'Meal', align: 'left' },
      { key: 'item', label: 'Item', align: 'left' },
      { key: 'weight', label: 'Weight (lbs)', align: 'right' },
      { key: 'price', label: 'Price ($)', align: 'right' },
    ];
    return (
      <Card sx={{ mb: 3, width: { xs: '100%', sm: '500px', md: '600px' }, maxWidth: '100%' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
          {list.items.map((dayObj, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Day {dayObj.day}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {foodColumns.map(col => (
                        <TableCell
                          key={col.key}
                          align={col.align}
                          sx={{ whiteSpace: 'nowrap', py: 1, px: 2 }}
                        >
                          <strong>{col.label}</strong>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(meal => (
                      dayObj[meal] ? (
                        <TableRow key={meal}>
                          <TableCell>{meal}</TableCell>
                          <TableCell sx={{ py: 1, px: 2 }}>{dayObj[meal].Item}</TableCell>
                          <TableCell align="right">{dayObj[meal].Weight}</TableCell>
                          <TableCell align="right">{dayObj[meal].Price}</TableCell>
                        </TableRow>
                      ) : null
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>Total Weight:</strong> {list.totalWeight} lbs<br />
            <strong>Total Price:</strong> ${list.totalPrice}<br />
            <strong>Total Calories:</strong> {list.totalCalories}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // All other categories: render a single table, with category-specific columns
  const columns = [
    { key: 'item', label: 'Item', align: 'left' },
    ...(type === 'clothing' ? [{ key: 'quantity', label: 'Quantity', align: 'right' }] : []),
    { key: 'weight', label: 'Weight (lbs)', align: 'right' },
    { key: 'price', label: 'Price ($)', align: 'right' },
  ];

  // For non-clothing categories, ensure all columns have the same padding and alignment
  const cellSx = { py: 1, px: 2, whiteSpace: 'nowrap' };

  return (
    <Card sx={{ mb: 3, width: { xs: '100%', sm: '500px', md: '600px' }, maxWidth: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map(col => (
                  <TableCell
                    key={col.key}
                    align={col.align}
                    sx={cellSx}
                  >
                    <strong>{col.label}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(list.items) && list.items.map((item, i) => (
                <TableRow key={i}>
                  {columns.map(col => (
                    <TableCell
                      key={col.key}
                      align={col.align}
                      sx={cellSx}
                    >
                      {col.key === 'item' ? (item.item || item.Item || '')
                        : col.key === 'quantity' ? (item.quantity !== undefined ? item.quantity : 1)
                        : col.key === 'weight' ? (item.weight || item.Weight || 0)
                        : col.key === 'price' ? (item.price || item.Price || 0)
                        : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Total Weight:</strong> {list.totalWeight} lbs<br />
          <strong>Total Price:</strong> ${list.totalPrice}
        </Typography>
      </CardContent>
    </Card>
  );
}
