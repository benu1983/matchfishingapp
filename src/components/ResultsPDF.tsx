import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ParticipantWithStats } from '../types';

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
  tableColRanking: {
    width: '10%',
    padding: 5,
  },
  tableColSector: {
    width: '10%',
    padding: 5,
  },
  tableColPlace: {
    width: '10%',
    padding: 5,
  },
  tableColClass: {
    width: '10%',
    padding: 5,
  },
  tableColName: {
    width: '30%',
    padding: 5,
  },
  tableColClub: {
    width: '15%',
    padding: 5,
  },
  tableColWeight: {
    width: '10%',
    padding: 5,
  },
  tableColPoints: {
    width: '5%',
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

interface ResultsPDFProps {
  results: ParticipantWithStats[];
  getSector: (place: number) => string;
  hasKlasse: boolean;
  hasClub: boolean;
  competitionName?: string;
  competitionDate?: string;
  competitionLocation?: string;
}

export function ResultsPDF({ 
  results, 
  getSector, 
  hasKlasse, 
  hasClub,
  competitionName,
  competitionDate,
  competitionLocation
}: ResultsPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>
            Uitslag
            {competitionName && competitionDate && (
              <> - {competitionName} - {new Date(competitionDate).toLocaleDateString('nl-NL')}</>
            )}
          </Text>
          {competitionLocation && (
            <Text style={styles.location}>{competitionLocation}</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.tableColRanking}>
              <Text style={styles.tableHeaderCell}>Ranking</Text>
            </View>
            <View style={styles.tableColSector}>
              <Text style={styles.tableHeaderCell}>Sector</Text>
            </View>
            <View style={styles.tableColPlace}>
              <Text style={styles.tableHeaderCell}>Plaats</Text>
            </View>
            {hasKlasse && (
              <View style={styles.tableColClass}>
                <Text style={styles.tableHeaderCell}>Klasse</Text>
              </View>
            )}
            <View style={styles.tableColName}>
              <Text style={styles.tableHeaderCell}>Naam</Text>
            </View>
            {hasClub && (
              <View style={styles.tableColClub}>
                <Text style={styles.tableHeaderCell}>Club</Text>
              </View>
            )}
            <View style={styles.tableColWeight}>
              <Text style={styles.tableHeaderCell}>Gewicht{'\n'}Gram</Text>
            </View>
            <View style={styles.tableColPoints}>
              <Text style={styles.tableHeaderCell}>Ptn</Text>
            </View>
          </View>

          {results.map((participant, index) => (
            <View style={styles.tableRow} key={participant.id}>
              <View style={styles.tableColRanking}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={styles.tableColSector}>
                <Text style={styles.tableCell}>
                  {participant.place ? getSector(participant.place) : '-'}
                </Text>
              </View>
              <View style={styles.tableColPlace}>
                <Text style={styles.tableCell}>{participant.place || '-'}</Text>
              </View>
              {hasKlasse && (
                <View style={styles.tableColClass}>
                  <Text style={styles.tableCell}>{participant.klasse || '-'}</Text>
                </View>
              )}
              <View style={styles.tableColName}>
                <Text style={styles.tableCell}>{participant.name}</Text>
              </View>
              {hasClub && (
                <View style={styles.tableColClub}>
                  <Text style={styles.tableCell}>{participant.club || '-'}</Text>
                </View>
              )}
              <View style={styles.tableColWeight}>
                <Text style={styles.tableCellRight}>{participant.totalWeight}</Text>
              </View>
              <View style={styles.tableColPoints}>
                <Text style={styles.tableCellRight}>{participant.points}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}