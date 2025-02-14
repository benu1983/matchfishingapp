import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
  settings: {
    marginBottom: 20,
    fontSize: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
  },
  tableRowGray: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    backgroundColor: '#f5f5f5',
  },
  colRanking: {
    width: '8%',
    padding: 5,
  },
  colKlasse: {
    width: '8%',
    padding: 5,
  },
  colName: {
    width: '20%',
    padding: 5,
  },
  colCompetition: {
    width: '7%',
    padding: 5,
    textAlign: 'right',
  },
  colTotal: {
    width: '10%',
    padding: 5,
    textAlign: 'right',
  },
  cell: {
    fontSize: 10,
  },
  cellBold: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cellStrikethrough: {
    fontSize: 10,
    textDecoration: 'line-through',
    color: '#666',
  },
  cellRed: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: 'bold',
  }
});

interface CriteriumStandingsPDFProps {
  folderName: string;
  penaltyPoints: number;
  excludeCount: number;
  participants: {
    name: string;
    klasse: string;
    competitions: {
      points: number;
      weight: number;
      present: boolean;
      excluded?: boolean;
    }[];
    totalPoints: number;
    totalWeight: number;
  }[];
}

export function CriteriumStandingsPDF({ 
  folderName,
  penaltyPoints,
  excludeCount,
  participants 
}: CriteriumStandingsPDFProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>
            Tussenstand Criterium - {folderName}
          </Text>
        </View>

        <View style={styles.settings}>
          <View style={styles.settingsRow}>
            <Text>Strafpunten voor afwezigheid: {penaltyPoints}</Text>
            <Text>Aantal wedstrijden laten vallen: {excludeCount}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colRanking}>
              <Text style={styles.cellBold}>Ranking</Text>
            </View>
            <View style={styles.colKlasse}>
              <Text style={styles.cellBold}>Klasse</Text>
            </View>
            <View style={styles.colName}>
              <Text style={styles.cellBold}>Naam</Text>
            </View>
            {participants[0].competitions.map((_, index) => (
              <View key={`header-${index}`} style={styles.colCompetition}>
                <Text style={styles.cellBold}>W{index + 1}</Text>
              </View>
            ))}
            <View style={styles.colTotal}>
              <Text style={styles.cellBold}>Totaal Ptn</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.cellBold}>Totaal Gew.</Text>
            </View>
          </View>

          {participants.map((participant, index) => (
            <View key={`participant-${participant.name}-${index}`}>
              {/* Points row */}
              <View style={styles.tableRow}>
                <View style={styles.colRanking}>
                  <Text style={styles.cellBold}>{index + 1}</Text>
                </View>
                <View style={styles.colKlasse}>
                  <Text style={styles.cell}>{participant.klasse}</Text>
                </View>
                <View style={styles.colName}>
                  <Text style={styles.cell}>{participant.name}</Text>
                </View>
                {participant.competitions.map((comp, compIndex) => (
                  <View key={`points-${compIndex}`} style={styles.colCompetition}>
                    <Text style={
                      comp.excluded ? styles.cellStrikethrough :
                      !comp.present ? styles.cellRed :
                      styles.cell
                    }>
                      {comp.present ? comp.points : penaltyPoints}
                    </Text>
                  </View>
                ))}
                <View style={styles.colTotal}>
                  <Text style={styles.cellBold}>{participant.totalPoints}</Text>
                </View>
                <View style={styles.colTotal}>
                  <Text style={styles.cellBold}>{participant.totalWeight}</Text>
                </View>
              </View>
              {/* Weight row */}
              <View style={styles.tableRowGray}>
                <View style={styles.colRanking}>
                  <Text style={styles.cell}></Text>
                </View>
                <View style={styles.colKlasse}>
                  <Text style={styles.cell}></Text>
                </View>
                <View style={styles.colName}>
                  <Text style={styles.cell}></Text>
                </View>
                {participant.competitions.map((comp, compIndex) => (
                  <View key={`weight-${compIndex}`} style={styles.colCompetition}>
                    <Text style={comp.excluded ? styles.cellStrikethrough : styles.cell}>
                      {comp.weight}
                    </Text>
                  </View>
                ))}
                <View style={styles.colTotal}>
                  <Text style={styles.cell}></Text>
                </View>
                <View style={styles.colTotal}>
                  <Text style={styles.cell}></Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}