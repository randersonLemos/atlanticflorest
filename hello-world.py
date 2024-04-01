import ee
import geemap
from module.core import image
from module.spec.lulc import Brazil


if __name__ == '__main__':
    # Trigger the authentication flow.
    ee.Authenticate()
    
    # Initialize the library.
    ee.Initialize(project='ee-mataatlantica')

    brazil = Brazil()

    brazil.bandNames()

    import IPython; IPython.embed()
    #brazil = ee.Image(
    #    'projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1'
    #).select('classification_2020')

    #biome = ee.FeatureCollection(
    #    'projects/mapbiomas-workspace/AUXILIAR/ESTATISTICAS/COLECAO8/VERSAO-1/refined_biome'    
    #).filter('FEATURE_ID == 5').first()

    #atlanticFlorest = brazil.clip( biome )
    #atlanticFlorestFlorestFormation = \
    #    atlanticFlorest.updateMask( atlanticFlorest.eq(3))


