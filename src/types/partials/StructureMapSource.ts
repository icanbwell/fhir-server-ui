/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TId } from '../simpleTypes/Id';
import { TInt } from '../simpleTypes/Int';
import { TBase64Binary } from '../simpleTypes/Base64Binary';
import { TCanonical } from '../simpleTypes/Canonical';
import { TDate } from '../simpleTypes/Date';
import { TDateTime } from '../simpleTypes/DateTime';
import { TDecimal } from '../simpleTypes/Decimal';
import { TInstant } from '../simpleTypes/Instant';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TOid } from '../simpleTypes/Oid';
import { TTime } from '../simpleTypes/Time';
import { TUnsignedInt } from '../simpleTypes/UnsignedInt';
import { TUri } from '../simpleTypes/Uri';
import { TUrl } from '../simpleTypes/Url';
import { TUuid } from '../simpleTypes/Uuid';
import { TAddress } from '../partials/Address';
import { TQuantity } from '../partials/Quantity';
import { TAnnotation } from '../partials/Annotation';
import { TAttachment } from '../partials/Attachment';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TCoding } from '../partials/Coding';
import { TContactPoint } from '../partials/ContactPoint';
import { THumanName } from '../partials/HumanName';
import { TIdentifier } from '../partials/Identifier';
import { TMoney } from '../partials/Money';
import { TPeriod } from '../partials/Period';
import { TRange } from '../partials/Range';
import { TRatio } from '../partials/Ratio';
import { TReference } from '../partials/Reference';
import { TSampledData } from '../partials/SampledData';
import { TSignature } from '../partials/Signature';
import { TTiming } from '../partials/Timing';
import { TContactDetail } from '../partials/ContactDetail';
import { TContributor } from '../partials/Contributor';
import { TDataRequirement } from '../partials/DataRequirement';
import { TExpression } from '../partials/Expression';
import { TParameterDefinition } from '../partials/ParameterDefinition';
import { TRelatedArtifact } from '../partials/RelatedArtifact';
import { TTriggerDefinition } from '../partials/TriggerDefinition';
import { TUsageContext } from '../partials/UsageContext';
import { TDosage } from '../partials/Dosage';
import { TMeta } from '../partials/Meta';

export type TStructureMapSource = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    context: TId;
    min?: TInt;
    max?: String;
    type?: String;
    defaultValueBase64Binary?: TBase64Binary;
    defaultValueBoolean?: Boolean;
    defaultValueCanonical?: TCanonical;
    defaultValueCode?: String;
    defaultValueDate?: TDate;
    defaultValueDateTime?: TDateTime;
    defaultValueDecimal?: TDecimal;
    defaultValueId?: TId;
    defaultValueInstant?: TInstant;
    defaultValueInteger?: TInt;
    defaultValueMarkdown?: TMarkdown;
    defaultValueOid?: TOid;
    defaultValuePositiveInt?: TInt;
    defaultValueString?: String;
    defaultValueTime?: TTime;
    defaultValueUnsignedInt?: TUnsignedInt;
    defaultValueUri?: TUri;
    defaultValueUrl?: TUrl;
    defaultValueUuid?: TUuid;
    defaultValueAddress?: TAddress;
    defaultValueAge?: TQuantity;
    defaultValueAnnotation?: TAnnotation;
    defaultValueAttachment?: TAttachment;
    defaultValueCodeableConcept?: TCodeableConcept;
    defaultValueCoding?: TCoding;
    defaultValueContactPoint?: TContactPoint;
    defaultValueCount?: TQuantity;
    defaultValueDistance?: TQuantity;
    defaultValueDuration?: TQuantity;
    defaultValueHumanName?: THumanName;
    defaultValueIdentifier?: TIdentifier;
    defaultValueMoney?: TMoney;
    defaultValuePeriod?: TPeriod;
    defaultValueQuantity?: TQuantity;
    defaultValueRange?: TRange;
    defaultValueRatio?: TRatio;
    defaultValueReference?: TReference;
    defaultValueSampledData?: TSampledData;
    defaultValueSignature?: TSignature;
    defaultValueTiming?: TTiming;
    defaultValueContactDetail?: TContactDetail;
    defaultValueContributor?: TContributor;
    defaultValueDataRequirement?: TDataRequirement;
    defaultValueExpression?: TExpression;
    defaultValueParameterDefinition?: TParameterDefinition;
    defaultValueRelatedArtifact?: TRelatedArtifact;
    defaultValueTriggerDefinition?: TTriggerDefinition;
    defaultValueUsageContext?: TUsageContext;
    defaultValueDosage?: TDosage;
    defaultValueMeta?: TMeta;
    element?: String;
    listMode?: String;
    variable?: TId;
    condition?: String;
    check?: String;
    logMessage?: String;
};

