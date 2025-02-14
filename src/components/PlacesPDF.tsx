import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Participant, CompetitionDetails } from '../types';

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
  location: {
    fontSize: 18,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginTop: 4,
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
  tableColNumber: {
    width: '15%',
    padding: 5,
  },
  tableColSector: {
    width: '15%',
    padding: 5,
  },
  tableColName: {
    width: '70%',
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});

interface PlacesPDFProps {
  participants: Participant[];
  getSector: (place: number) => string;
  competition?: CompetitionDetails;
}

export function PlacesPDF({ participants, getSector, competition }: PlacesPDFProps) {
  const sortedParticipants = [...participants].sort((a, b) => {
    const aPlace = a.place || Infinity;
    const bPlace = b.place || Infinity;
    return aPlace - bPlace;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>
            Plaatsnummers
            {competition && (
              <> - {competition.name} - {new Date(competition.date).toLocaleDateString('nl-NL')}</>
            )}
          </Text>
          {competition && (
            <Text style={styles.location}>{competition.location}</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.tableColNumber}>
              <Text style={styles.tableHeaderCell}>Nummer</Text>
            </View>
            <View style={styles.tableColSector}>
              <Text style={styles.tableHeaderCell}>Sector</Text>
            </View>
            <View style={styles.tableColName}>
              <Text style={styles.tableHeaderCell}>Naam</Text>
            </View>
          </View>

          {sortedParticipants.map((participant) => (
            <View style={styles.tableRow} key={participant.id}>
              <View style={styles.tableColNumber}>
                <Text style={styles.tableCell}>{participant.place || '-'}</Text>
              </View>
              <View style={styles.tableColSector}>
                <Text style={styles.tableCell}>
                  {participant.place ? getSector(participant.place) : '-'}
                </Text>
              </View>
              <View style={styles.tableColName}>
                <Text style={styles.tableCell}>{participant.name}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}