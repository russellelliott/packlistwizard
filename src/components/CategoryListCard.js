import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function CategoryListCard({ title, list, type }) {
  if (!list) return null;
  // For food, show by day with meals
  if (type === 'food' && Array.isArray(list.items)) {
    return (
      <Card sx={{ mb: 3, width: { xs: '100%', sm: '500px', md: '600px' }, maxWidth: '100%' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            {list.items.map((dayObj, i) => (
              <li key={i}>
                <Typography variant="subtitle1">Day {dayObj.day}</Typography>
                <Box sx={{ pl: 2 }}>
                  {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(meal => (
                    dayObj[meal] ? (
                      <Typography key={meal} variant="body2">
                        <strong>{meal}:</strong> {dayObj[meal].Item} ({dayObj[meal].Weight} lbs, ${dayObj[meal].Price}, {dayObj[meal].Calories} cal)
                      </Typography>
                    ) : null
                  ))}
                </Box>
              </li>
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>Total Weight:</strong> {list.totalWeight} lbs<br />
            <strong>Total Price:</strong> ${list.totalPrice}<br />
            <strong>Total Calories:</strong> {list.totalCalories}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  // For other categories
  return (
    <Card sx={{ mb: 3, width: { xs: '100%', sm: '500px', md: '600px' }, maxWidth: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          {Array.isArray(list.items) && list.items.map((item, i) => (
            <li key={i}>
              <Typography variant="body2">
                <strong>{item.item || item.Item || ''}</strong> ({item.weight || item.Weight || 0} lbs, ${item.price || item.Price || 0})
              </Typography>
            </li>
          ))}
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Total Weight:</strong> {list.totalWeight} lbs<br />
          <strong>Total Price:</strong> ${list.totalPrice}
        </Typography>
      </CardContent>
    </Card>
  );
}
