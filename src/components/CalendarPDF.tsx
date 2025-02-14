import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { CalendarEvent } from '../types';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 4,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    backgroundColor: '#f5f5f5',
  },
  tableColDate: {
    width: '15%',
    padding: 5,
  },
  tableColTime: {
    width: '15%',
    padding: 5,
  },
  tableColName: {
    width: '25%',
    padding: 5,
  },
  tableColType: {
    width: '15%',
    padding: 5,
  },
  tableColFormat: {
    width: '15%',
    padding: 5,
  },
  tableColAccess: {
    width: '15%',
    padding: 5,
  },
  cell: {
    fontSize: 10,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});

const formatTime = (time: string) => {
  return time.substring(0, 5); // Only show HH:mm
};

const getRodTypeLabel = (type: string) => {
  switch (type) {
    case 'fixed-rod': return 'Vaste Stok';
    case 'feeder': return 'Feeder';
    case 'open': return 'Open';
    case 'open-float': return 'Open Dobber';
    default: return type;
  }
};

const getFormatLabel = (format: string) => {
  switch (format) {
    case 'single': return 'Individueel';
    case 'pair': return 'Koppel';
    case 'trio': return 'Trio';
    case 'other': return 'Anders';
    default: return format;
  }
};

const getAccessLabel = (access: string) => {
  switch (access) {
    case 'members-only': return 'Alleen leden';
    case 'public': return 'Openbaar';
    default: return access;
  }
};

interface CalendarPDFProps {
  events: CalendarEvent[];
}

export function CalendarPDF({ events }: CalendarPDFProps) {
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Wedstrijdkalender</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.tableColDate}>
              <Text style={styles.headerCell}>Datum</Text>
            </View>
            <View style={styles.tableColTime}>
              <Text style={styles.headerCell}>Tijd</Text>
            </View>
            <View style={styles.tableColName}>
              <Text style={styles.headerCell}>Naam</Text>
            </View>
            <View style={styles.tableColType}>
              <Text style={styles.headerCell}>Type Hengel</Text>
            </View>
            <View style={styles.tableColFormat}>
              <Text style={styles.headerCell}>Type Wedstrijd</Text>
            </View>
            <View style={styles.tableColAccess}>
              <Text style={styles.headerCell}>Toegang</Text>
            </View>
          </View>

          {sortedEvents.map((event) => (
            <View key={event.id} style={styles.tableRow}>
              <View style={styles.tableColDate}>
                <Text style={styles.cell}>
                  {new Date(event.date).toLocaleDateString('nl-NL')}
                </Text>
              </View>
              <View style={styles.tableColTime}>
                <Text style={styles.cell}>
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </Text>
              </View>
              <View style={styles.tableColName}>
                <Text style={styles.cell}>{event.name}</Text>
              </View>
              <View style={styles.tableColType}>
                <Text style={styles.cell}>{getRodTypeLabel(event.type)}</Text>
              </View>
              <View style={styles.tableColFormat}>
                <Text style={styles.cell}>{getFormatLabel(event.format)}</Text>
              </View>
              <View style={styles.tableColAccess}>
                <Text style={styles.cell}>{getAccessLabel(event.access)}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}