import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Participant, ColumnToggles, CompetitionDetails } from '../types';

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
  competitionName: {
    fontSize: 18,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 4,
  },
  competitionDate: {
    fontSize: 18,
    fontWeight: 'bold',
    textDecoration: 'underline',
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
    width: '10%',
    padding: 5,
  },
  tableColName: {
    width: columns => columns.club || columns.klasse ? '40%' : '90%',
    padding: 5,
  },
  tableColClub: {
    width: '30%',
    padding: 5,
  },
  tableColClass: {
    width: '20%',
    padding: 5,
  },
  tableColPayment: {
    width: '15%',
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

interface ParticipantsPDFProps {
  participants: Participant[];
  columns: ColumnToggles & { payment: boolean };
  competition?: CompetitionDetails;
}

export function ParticipantsPDF({ participants, columns, competition }: ParticipantsPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>
            Deelnemers
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
              <Text style={styles.tableHeaderCell}>Nr.</Text>
            </View>
            <View style={styles.tableColName}>
              <Text style={styles.tableHeaderCell}>Naam</Text>
            </View>
            {columns.club && (
              <View style={styles.tableColClub}>
                <Text style={styles.tableHeaderCell}>Club</Text>
              </View>
            )}
            {columns.klasse && (
              <View style={styles.tableColClass}>
                <Text style={styles.tableHeaderCell}>Klasse</Text>
              </View>
            )}
            {columns.payment && (
              <View style={styles.tableColPayment}>
                <Text style={styles.tableHeaderCell}>Betaald</Text>
              </View>
            )}
          </View>

          {participants.map((participant) => (
            <View style={styles.tableRow} key={participant.id}>
              <View style={styles.tableColNumber}>
                <Text style={styles.tableCell}>{participant.id}</Text>
              </View>
              <View style={styles.tableColName}>
                <Text style={styles.tableCell}>{participant.name}</Text>
              </View>
              {columns.club && (
                <View style={styles.tableColClub}>
                  <Text style={styles.tableCell}>{participant.club || ''}</Text>
                </View>
              )}
              {columns.klasse && (
                <View style={styles.tableColClass}>
                  <Text style={styles.tableCell}>{participant.klasse || ''}</Text>
                </View>
              )}
              {columns.payment && (
                <View style={styles.tableColPayment}>
                  <Text style={styles.tableCell}>{participant.hasPaid ? 'Ja' : 'Nee'}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}