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
  // For food, show by day with meals in a table
  if (type === 'food' && Array.isArray(list.items)) {
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
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 1, px: 2 }}><strong>Meal</strong></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 1, px: 2 }}><strong>Item</strong></TableCell>
                      <TableCell align="right"><strong>Weight&nbsp;(lbs)</strong></TableCell>
                      <TableCell align="right"><strong>Price&nbsp;($)</strong></TableCell>
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
  // For other categories, show items in a table
  return (
    <Card sx={{ mb: 3, width: { xs: '100%', sm: '500px', md: '600px' }, maxWidth: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap', py: 1, px: 2 }}><strong>Item</strong></TableCell>
                {type === 'clothing' && <TableCell sx={{ whiteSpace: 'nowrap', py: 1, px: 2 }}><strong>Quantity</strong></TableCell>}
                <TableCell align="right"><strong>Weight&nbsp;(lbs)</strong></TableCell>
                <TableCell align="right"><strong>Price&nbsp;($)</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(list.items) && list.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ py: 1, px: 2 }}>{item.item || item.Item || ''}</TableCell>
                  {type === 'clothing' && <TableCell sx={{ py: 1, px: 2 }}>{item.quantity !== undefined ? item.quantity : 1}</TableCell>}
                  <TableCell align="right">{item.weight || item.Weight || 0}</TableCell>
                  <TableCell align="right">{item.price || item.Price || 0}</TableCell>
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
