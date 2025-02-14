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
  tableColSector: {
    width: '15%',
    padding: 5,
  },
  tableColPlace: {
    width: '15%',
    padding: 5,
  },
  tableColName: {
    width: '40%',
    padding: 5,
  },
  tableColWeight: {
    width: '15%',
    padding: 5,
  },
  tableColRanking: {
    width: '15%',
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
  },
  tableCellRight: {
    fontSize: 10,
    textAlign: 'right',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});

interface WeighingPDFProps {
  participants: (Participant & { totalWeight: number })[];
  getSector: (place: number) => string;
  competition?: CompetitionDetails;
}

export function WeighingPDF({ participants, getSector, competition }: WeighingPDFProps) {
  const getSectorRanking = (participant: Participant & { totalWeight: number }) => {
    if (!participant.place) return '-';
    const sector = getSector(participant.place);
    
    const sectorParticipants = participants.filter(p => p.place && getSector(p.place) === sector);
    const sortedSectorParticipants = sectorParticipants.sort((a, b) => {
      if (b.totalWeight !== a.totalWeight) {
        return b.totalWeight - a.totalWeight;
      }
      return (a.place || 0) - (b.place || 0);
    });

    const position = sortedSectorParticipants.findIndex(p => p.id === participant.id) + 1;
    return position.toString();
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>
            Wegingen
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
            <View style={styles.tableColSector}>
              <Text style={styles.tableHeaderCell}>Sector</Text>
            </View>
            <View style={styles.tableColPlace}>
              <Text style={styles.tableHeaderCell}>Plaats</Text>
            </View>
            <View style={styles.tableColName}>
              <Text style={styles.tableHeaderCell}>Naam</Text>
            </View>
            <View style={styles.tableColWeight}>
              <Text style={styles.tableHeaderCell}>Gewicht{'\n'}Gram</Text>
            </View>
            <View style={styles.tableColRanking}>
              <Text style={styles.tableHeaderCell}>Punten</Text>
            </View>
          </View>

          {participants.map((participant) => (
            <View style={styles.tableRow} key={participant.id}>
              <View style={styles.tableColSector}>
                <Text style={styles.tableCell}>
                  {participant.place ? getSector(participant.place) : '-'}
                </Text>
              </View>
              <View style={styles.tableColPlace}>
                <Text style={styles.tableCell}>{participant.place || '-'}</Text>
              </View>
              <View style={styles.tableColName}>
                <Text style={styles.tableCell}>{participant.name}</Text>
              </View>
              <View style={styles.tableColWeight}>
                <Text style={styles.tableCellRight}>{participant.totalWeight}</Text>
              </View>
              <View style={styles.tableColRanking}>
                <Text style={styles.tableCellRight}>{getSectorRanking(participant)}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}