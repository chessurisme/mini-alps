import { 
  startOfDay, endOfDay, 
  subDays, 
  startOfWeek, endOfWeek, subWeeks, 
  startOfMonth, endOfMonth, subMonths, 
  startOfYear, endOfYear, subYears,
  parse,
} from 'date-fns';

export interface DatePatternMatch {
  type: string;
  match: string;
  month?: string;
  year?: string;
  day?: string;
  number?: string;
  period?: string;
  value?: string;
}

export function matchDateTimePatterns(text: string): DatePatternMatch[] | null {
    const patterns = {
        month: /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
        year: /(?:19|20)\d{2}/,
        dayName: /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i,
        dayNumber: /(?:[1-9]|[12][0-9]|3[01])/,
    };
    
    const results: DatePatternMatch[] = [];
    let match;

    // High specificity first
    // YYYYMMDD
    const yyyymmdd = /^(?:19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/;
    match = text.match(yyyymmdd);
    if (match) {
        results.push({ type: 'yyyymmdd', match: text, year: match[0].substring(0,4), month: match[0].substring(4,6), day: match[0].substring(6,8) });
    }

    // YYYYMM
    const yyyymm = /^(?:19|20)\d{2}(0[1-9]|1[0-2])$/;
    match = text.match(yyyymm);
    if (match) {
        results.push({ type: 'yyyymm', match: text, year: match[0].substring(0,4), month: match[0].substring(4,6) });
    }

    // month day, year - e.g., "May 21, 2002"
    const monthDayYear = new RegExp(`^(${patterns.month.source})\\s+(${patterns.dayNumber.source}),?\\s+(${patterns.year.source})$`, 'i');
    match = text.match(monthDayYear);
    if (match) {
        results.push({ type: 'month_day_year', match: text, month: match[1], day: match[2], year: match[3] });
    }
    
    // month year - e.g., "May 2023"
    const monthYear = new RegExp(`^(${patterns.month.source})\\s+(${patterns.year.source})$`, 'i');
    match = text.match(monthYear);
    if (match) {
        results.push({ type: 'month_year', match: text, month: match[1], year: match[2] });
    }
    
    // year month - e.g., "2025 June"
    const yearMonth = new RegExp(`^(${patterns.year.source})\\s+(${patterns.month.source})$`, 'i');
    match = text.match(yearMonth);
    if (match) {
        results.push({ type: 'year_month', match: text, year: match[1], month: match[2] });
    }

    // numbered periods - e.g. "last 3 years"
    const lastNumberPeriod = /^last (\d+) (years?|weeks?|months?|days?)$/i;
    match = text.match(lastNumberPeriod);
    if (match) {
        results.push({ type: 'relative_numbered_period', match: text, number: match[1], period: match[2].replace(/s$/,'') });
    }
    
    // single word periods
    if (/^last week$/i.test(text)) results.push({ type: 'relative_period', match: text, value: 'week' });
    if (/^last month$/i.test(text)) results.push({ type: 'relative_period', match: text, value: 'month' });
    if (/^last year$/i.test(text)) results.push({ type: 'relative_period', match: text, value: 'year' });

    // relative days
    if (/^today$/i.test(text)) results.push({ type: 'relative_day', match: text, value: '0' });
    if (/^yesterday$/i.test(text)) results.push({ type: 'relative_day', match: text, value: '1' });
    if (/^(the )?day before yesterday$/i.test(text)) results.push({ type: 'relative_day', match: text, value: '2' });
    
    // single units
    const monthOnly = new RegExp(`^(${patterns.month.source})$`, 'i');
    if (monthOnly.test(text)) {
        results.push({ type: 'month', match: text });
    }
    
    const yearOnly = new RegExp(`^(${patterns.year.source})$`);
    if (yearOnly.test(text)) {
        results.push({ type: 'year', match: text });
    }

    const dayOnly = new RegExp(`^(${patterns.dayName.source})$`, 'i');
    if (dayOnly.test(text)) {
        results.push({ type: 'day_name', match: text });
    }

    const uniqueResults = results.filter((v,i,a)=>a.findIndex(t=>(t.type === v.type && t.match === v.match))===i);

    return uniqueResults.length > 0 ? uniqueResults : null;
}

export function calculateDateRange(match: DatePatternMatch): [Date, Date] | null {
  const now = new Date();
  
  try {
    switch (match.type) {
      case 'yyyymmdd':
        if (match.year && match.month && match.day) {
            const date = parse(`${match.year}-${match.month}-${match.day}`, 'yyyy-MM-dd', new Date());
            if (!isNaN(date.getTime())) {
                return [startOfDay(date), endOfDay(date)];
            }
        }
        break;

      case 'yyyymm':
        if (match.year && match.month) {
            const date = parse(`${match.year}-${match.month}`, 'yyyy-MM', new Date());
            if (!isNaN(date.getTime())) {
                return [startOfMonth(date), endOfMonth(date)];
            }
        }
        break;

      case 'relative_day':
        if(match.value) {
            const daysAgo = parseInt(match.value, 10);
            const targetDay = subDays(now, daysAgo);
            return [startOfDay(targetDay), endOfDay(targetDay)];
        }
        break;

      case 'relative_period':
        if (match.value === 'week') {
          const lastWeek = subWeeks(now, 1);
          return [startOfWeek(lastWeek), endOfWeek(lastWeek)];
        }
        if (match.value === 'month') {
          const lastMonth = subMonths(now, 1);
          return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
        }
        if (match.value === 'year') {
          const lastYear = subYears(now, 1);
          return [startOfYear(lastYear), endOfYear(lastYear)];
        }
        break;

      case 'relative_numbered_period':
        if(match.number && match.period) {
            const num = parseInt(match.number, 10);
            const period = match.period as 'year' | 'month' | 'week' | 'day';
            let startDate;
            if(period === 'year') startDate = subYears(now, num);
            else if(period === 'month') startDate = subMonths(now, num);
            else if(period === 'week') startDate = subWeeks(now, num);
            else startDate = subDays(now, num);
            return [startOfDay(startDate), endOfDay(now)];
        }
        break;
      
      case 'month_day_year':
          if(match.month && match.day && match.year){
              const date = parse(`${match.month} ${match.day} ${match.year}`, 'MMMM d yyyy', new Date());
               if(!isNaN(date.getTime())){
                   return [startOfDay(date), endOfDay(date)];
               }
          }
          break;
  
      case 'month_year':
      case 'year_month':
          if (match.month && match.year) {
              const date = parse(`${match.month} ${match.year}`, 'MMMM yyyy', new Date());
              if(!isNaN(date.getTime())){
                  return [startOfMonth(date), endOfMonth(date)];
              }
          }
          break;
  
      case 'month':
          if(match.match) {
              const date = parse(match.match, 'MMMM', new Date()); // Defaults to current year
              if(!isNaN(date.getTime())){
                  return [startOfMonth(date), endOfMonth(date)];
              }
          }
          break;
  
      case 'year':
          if(match.match) {
              const date = parse(match.match, 'yyyy', new Date());
              if(!isNaN(date.getTime())){
                  return [startOfYear(date), endOfYear(date)];
              }
          }
          break;
    }
  } catch(e) {
      console.error("Error calculating date range", e);
      return null;
  }
  return null;
}
