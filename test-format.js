// Test formatDate function
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month];
}

function getDayName(day) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function formatDate(date, format) {
  const map = {
    YYYY: date.getFullYear().toString(),
    YY: date.getFullYear().toString().slice(-2),
    MMMM: getMonthName(date.getMonth()),
    MMM: getMonthName(date.getMonth()).slice(0, 3),
    MM: (date.getMonth() + 1).toString().padStart(2, '0'),
    M: (date.getMonth() + 1).toString(),
    DD: date.getDate().toString().padStart(2, '0'),
    D: date.getDate().toString(),
    dddd: getDayName(date.getDay()),
    ddd: getDayName(date.getDay()).slice(0, 3),
    HH: date.getHours().toString().padStart(2, '0'),
    H: date.getHours().toString(),
    mm: date.getMinutes().toString().padStart(2, '0'),
    m: date.getMinutes().toString(),
    ss: date.getSeconds().toString().padStart(2, '0'),
    s: date.getSeconds().toString(),
  };

  let result = format;

  // Handle [Q] for quarter
  if (result.includes('[Q]')) {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    result = result.replace(/\[Q\]/g, quarter.toString());
  }

  // Handle week numbers
  const weekNum = getWeekNumber(date);
  result = result.replace(/\[Week\]\s*W/g, `Week ${weekNum}`);
  result = result.replace(/W\[w\]/g, `W${weekNum}`);

  // Token replacement
  const tokenPattern = /(YYYY|MMMM|dddd|MMM|ddd|MM|DD|HH|mm|ss|YY|M|D|H|m|s)/g;

  result = result.replace(tokenPattern, (match) => {
    return map[match] || match;
  });

  return result;
}

// Test cases
const testDate = new Date(2025, 10, 15, 14, 30); // November 15, 2025, 14:30

console.log('Testing formatDate function:');
console.log('Date:', testDate);
console.log('');

const tests = [
  { format: 'MMMM YYYY', expected: 'November 2025' },
  { format: 'W[w]', expected: 'W46' },
  { format: 'D', expected: '15' },
  { format: 'MMM', expected: 'Nov' },
  { format: 'dddd, MMMM D, YYYY', expected: 'Saturday, November 15, 2025' },
  { format: 'HH:mm', expected: '14:30' },
];

tests.forEach(test => {
  const result = formatDate(testDate, test.format);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`${status} Format: "${test.format}"`);
  console.log(`  Expected: "${test.expected}"`);
  console.log(`  Got:      "${result}"`);
  if (result !== test.expected) {
    console.log(`  MISMATCH!`);
  }
  console.log('');
});
