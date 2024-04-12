import ee
import pprint

class AtlanticForestFeature:
    def __init__(self):
        self.feature = ee.FeatureCollection(
               'projects/mapbiomas-workspace/AUXILIAR/ESTATISTICAS/COLECAO8/VERSAO-1/refined_biome'    
           ).filter('FEATURE_ID == 5').first()


